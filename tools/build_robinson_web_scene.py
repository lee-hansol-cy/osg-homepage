import math
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


root_dir = Path(__file__).resolve().parents[1]
output_dir = root_dir / "artifacts" / "robinson"
output_dir.mkdir(parents=True, exist_ok=True)


def srgb(value):
    channel = value / 255.0
    return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4


def make_material(name, color, roughness, metallic=0.0):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = color
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    return material


def replace_material(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.material_index = 0


def world_bounds(obj):
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    low = Vector(tuple(min(point[index] for point in corners) for index in range(3)))
    high = Vector(tuple(max(point[index] for point in corners) for index in range(3)))
    return low, high


def parent_baked_mesh(obj, parent, pivot=None):
    if obj.data.users > 1:
        obj.data = obj.data.copy()
    obj.data.transform(obj.matrix_world)
    if pivot is not None:
        obj.data.transform(Matrix.Translation(-pivot))
    obj.matrix_world = Matrix.Identity(4)
    obj.parent = parent
    obj.matrix_parent_inverse = Matrix.Identity(4)
    obj.matrix_basis = Matrix.Identity(4)


def bevelled_box(name, location, scale, material, collection, bevel=0.001):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = Vector(scale) * 0.5
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    modifier = obj.modifiers.new("Soft ABS edges", "BEVEL")
    modifier.width = bevel
    modifier.segments = 3
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    replace_material(obj, material)
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    collection.objects.link(obj)
    return obj


def cylinder(name, location, radius, depth, material, collection, rotation=(0.0, 0.0, 0.0), vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    replace_material(obj, material)
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    collection.objects.link(obj)
    return obj


def new_collection(name, parent):
    collection = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if collection.name not in parent.children:
        parent.children.link(collection)
    return collection


def look_at(obj, point):
    obj.rotation_euler = (Vector(point) - obj.location).to_track_quat("-Z", "Y").to_euler()


pink = (srgb(255), srgb(129), srgb(234), 1.0)
abs_material = make_material("ABS_FF81EA_OPAQUE", pink, 0.31)
pcb_material = make_material("Internal_PCB", (0.018, 0.095, 0.045, 1.0), 0.5)
battery_material = make_material("Internal_Battery", (0.09, 0.1, 0.12, 1.0), 0.42)
metal_material = make_material("Internal_Metal", (0.18, 0.2, 0.23, 1.0), 0.28, 0.68)
rubber_material = make_material("Internal_Rubber", (0.025, 0.027, 0.03, 1.0), 0.7)
chip_material = make_material("Internal_Chip", (0.015, 0.017, 0.02, 1.0), 0.4)

imported_objects = [obj for obj in bpy.data.objects if "plasticity_id" in obj]
for obj in imported_objects:
    obj.hide_set(False)
    obj.hide_viewport = False
    obj.hide_render = False
    if obj.type == "MESH":
        replace_material(obj, abs_material)
for collection in bpy.data.collections:
    collection.hide_viewport = False
    collection.hide_render = False

cavity_names = {"상판 내부 기판 공간", "하판 내부 기판 공간"}
for name in cavity_names:
    cavity = bpy.data.objects.get(name)
    if cavity:
        cavity.hide_set(True)
        cavity.hide_viewport = True
        cavity.hide_render = True

hinge_rods = [bpy.data.objects.get(name) for name in ("좌 힌지막대", "우 힌지막대")]
hinge_rods = [obj for obj in hinge_rods if obj]
rod_centers = [(world_bounds(obj)[0] + world_bounds(obj)[1]) * 0.5 for obj in hinge_rods]
hinge_axis = sum(rod_centers, Vector()) / len(rod_centers)

device_root = bpy.data.objects.new("Robinson_Device_Root", None)
bpy.context.scene.collection.objects.link(device_root)
device_root["web_role"] = "orbit_root"
device_root["units"] = "meters"

hinge_control = bpy.data.objects.new("Hinge_Control_0_170deg", None)
bpy.context.scene.collection.objects.link(hinge_control)
hinge_control.location = hinge_axis
hinge_control.rotation_mode = "XYZ"
hinge_control["web_role"] = "hinge_control"
hinge_control["axis"] = "X"
hinge_control["min_angle_deg"] = 0.0
hinge_control["max_angle_deg"] = 170.0
hinge_control["recommended_duration_s"] = 1.15
hinge_control["rotation_sign"] = 1.0

upper_names = {
    "상판",
    "상판 내부 기판 공간",
    "상판 소속 화면",
    "상판 소속 화면 베젤",
    "카메라 유리 검은색 베젤",
    "카메라 중앙유리",
    "카메라 렌즈",
    "조도 센서",
    "마이크",
}
upper_collection_names = {"상판 소속 화우 힌지", "힌지막대", "완충 고무", "상판 상태 LED"}
upper_objects = {obj for obj in imported_objects if obj.name in upper_names}
for collection_name in upper_collection_names:
    collection = bpy.data.collections.get(collection_name)
    if collection:
        upper_objects.update(collection.all_objects)

plasticity_group_nodes = {}
for collection in sorted((item for item in bpy.data.collections if "plasticity_id" in item), key=lambda item: item.name):
    group = bpy.data.objects.new(f"Plasticity_Group__{collection.name}", None)
    bpy.context.scene.collection.objects.link(group)
    group["web_role"] = "plasticity_group"
    group["plasticity_group_name"] = collection.name
    group.parent = hinge_control if collection.name in upper_collection_names else device_root
    group.matrix_parent_inverse = Matrix.Identity(4)
    group.matrix_basis = Matrix.Identity(4)
    plasticity_group_nodes[collection.name] = group

for obj in imported_objects:
    group_parent = next((plasticity_group_nodes[collection.name] for collection in obj.users_collection if collection.name in plasticity_group_nodes), None)
    parent_baked_mesh(obj, group_parent or (hinge_control if obj in upper_objects else device_root), hinge_axis if obj in upper_objects else None)
hinge_control.parent = device_root
hinge_control.matrix_parent_inverse = Matrix.Identity(4)
hinge_control.location = hinge_axis

hinge_control.rotation_euler.x = 0.0
hinge_control.keyframe_insert(data_path="rotation_euler", index=0, frame=1, group="Hinge_Open_170")
hinge_control.rotation_euler.x = math.radians(170.0)
hinge_control.keyframe_insert(data_path="rotation_euler", index=0, frame=90, group="Hinge_Open_170")
if hinge_control.animation_data and hinge_control.animation_data.action:
    hinge_control.animation_data.action.name = "Hinge_Open_170"
    for curve in hinge_control.animation_data.action.fcurves:
        for keyframe in curve.keyframe_points:
            keyframe.interpolation = "BEZIER"
            keyframe.easing = "AUTO"
hinge_limit = hinge_control.constraints.new("LIMIT_ROTATION")
hinge_limit.name = "Hinge_Travel_0_170deg"
hinge_limit.use_limit_x = True
hinge_limit.min_x = 0.0
hinge_limit.max_x = math.radians(170.0)
hinge_limit.owner_space = "LOCAL"

screen_upper = bpy.data.objects.get("상판 소속 화면")
screen_lower = bpy.data.objects.get("하판 소속 화면")
for screen, role in ((screen_upper, "screen_upper_ui"), (screen_lower, "screen_lower_ui")):
    if screen:
        screen["web_role"] = role
        screen["touch_enabled"] = True
        screen["press_depth_m"] = 0.0012
        screen["spring_frequency_hz"] = 6.5
        screen["spring_damping"] = 0.78
        screen["ui_texture_source"] = "CanvasTexture"

internal_root = new_collection("Internal_Components", bpy.context.scene.collection)
internal_lower = new_collection("Internal_Lower", internal_root)
internal_upper = new_collection("Internal_Upper", internal_root)
internal_objects = []

internal_objects.append(bevelled_box("PCB_Main", (-0.2404, 0.061, 0.0687), (0.082, 0.043, 0.0014), pcb_material, internal_lower, 0.0015))
internal_objects.append(bevelled_box("Battery_Pack", (-0.2404, 0.086, 0.0668), (0.050, 0.025, 0.0048), battery_material, internal_lower, 0.0025))
internal_objects.append(bevelled_box("PCB_IO_Daughterboard", (-0.2404, 0.0275, 0.0684), (0.054, 0.010, 0.0012), pcb_material, internal_lower, 0.001))

chip_specs = [
    ("SoC", (-0.2404, 0.053, 0.0702), (0.012, 0.012, 0.0017)),
    ("Memory", (-0.258, 0.052, 0.0701), (0.010, 0.008, 0.0015)),
    ("Power_IC", (-0.222, 0.052, 0.0701), (0.008, 0.007, 0.0015)),
    ("Wireless_Module", (-0.267, 0.070, 0.0702), (0.014, 0.010, 0.0018)),
]
for name, location, scale in chip_specs:
    internal_objects.append(bevelled_box(name, location, scale, chip_material, internal_lower, 0.0008))

for side, x in (("L", -0.291), ("R", -0.190)):
    speaker = cylinder(f"Speaker_{side}", (x, 0.091, 0.068), 0.0105, 0.004, rubber_material, internal_lower, vertices=48)
    speaker["component_type"] = "speaker_unit"
    internal_objects.append(speaker)
    magnet = cylinder(f"Speaker_Magnet_{side}", (x, 0.091, 0.0688), 0.0062, 0.0045, metal_material, internal_lower, vertices=40)
    internal_objects.append(magnet)

motor = cylinder("Vibration_Motor", (-0.292, 0.044, 0.0675), 0.0055, 0.014, metal_material, internal_lower, rotation=(0.0, math.radians(90), 0.0), vertices=40)
motor["component_type"] = "vibration_motor"
internal_objects.append(motor)

connector_specs = [
    ("USB_C_Internal", (-0.2404, 0.0195, 0.069), (0.012, 0.006, 0.004)),
    ("Audio_Internal", (-0.274, 0.023, 0.069), (0.008, 0.007, 0.004)),
    ("Display_FFC", (-0.213, 0.028, 0.070), (0.011, 0.006, 0.003)),
]
for name, location, scale in connector_specs:
    connector = bevelled_box(name, location, scale, metal_material, internal_lower, 0.0007)
    connector["component_type"] = "internal_connector"
    internal_objects.append(connector)

rib_specs = [
    ((-0.2404, 0.107, 0.0654), (0.104, 0.0018, 0.004)),
    ((-0.2404, 0.024, 0.0654), (0.096, 0.0018, 0.004)),
    ((-0.303, 0.064, 0.0654), (0.0018, 0.070, 0.004)),
    ((-0.178, 0.064, 0.0654), (0.0018, 0.070, 0.004)),
    ((-0.275, 0.064, 0.0654), (0.0015, 0.045, 0.0035)),
    ((-0.206, 0.064, 0.0654), (0.0015, 0.045, 0.0035)),
]
for index, (location, scale) in enumerate(rib_specs, 1):
    rib = bevelled_box(f"Reinforcing_Rib_{index:02d}", location, scale, abs_material, internal_lower, 0.0006)
    rib["component_type"] = "reinforcing_rib"
    internal_objects.append(rib)

for index, (x, y) in enumerate(((-0.296, 0.031), (-0.185, 0.031), (-0.296, 0.099), (-0.185, 0.099), (-0.264, 0.077), (-0.217, 0.077)), 1):
    boss = cylinder(f"Screw_Boss_{index:02d}", (x, y, 0.0662), 0.0032, 0.006, abs_material, internal_lower, vertices=32)
    boss["component_type"] = "screw_boss"
    internal_objects.append(boss)

upper_pcb = bevelled_box("Upper_Display_PCB", (-0.2404, 0.063, 0.0816), (0.085, 0.061, 0.0012), pcb_material, internal_upper, 0.0015)
upper_pcb["component_type"] = "pcb"
internal_objects.append(upper_pcb)
camera_module = bevelled_box("Camera_Module_Internal", (-0.2404, 0.101, 0.0815), (0.014, 0.010, 0.0022), chip_material, internal_upper, 0.001)
internal_objects.append(camera_module)
sensor_flex = bevelled_box("Sensor_Flex_PCB", (-0.265, 0.101, 0.0817), (0.020, 0.007, 0.001), pcb_material, internal_upper, 0.0007)
internal_objects.append(sensor_flex)

for obj in internal_objects:
    obj["web_role"] = "internal_component"
    if obj.users_collection[0] == internal_upper:
        parent_baked_mesh(obj, hinge_control, hinge_axis)
    else:
        parent_baked_mesh(obj, device_root)
    obj.hide_set(True)
    obj.hide_render = True
for collection in (internal_root, internal_lower, internal_upper):
    collection.hide_viewport = True
    collection.hide_render = True

collider_material = make_material("Interaction_Collider", (0.0, 0.0, 0.0, 0.0), 1.0)
collider_material.surface_render_method = "DITHERED"
collider_material.diffuse_color = (0.0, 0.0, 0.0, 0.0)
interaction_collection = new_collection("Web_Interaction_Proxies", bpy.context.scene.collection)
upper_collider = bevelled_box("Interaction_Collider_Upper", (-0.2404, 0.0624, 0.0773), (0.133, 0.0916, 0.012), collider_material, interaction_collection, 0.004)
lower_collider = bevelled_box("Interaction_Collider_Lower", (-0.2404, 0.0624, 0.0700), (0.133, 0.0916, 0.0172), collider_material, interaction_collection, 0.004)
for collider, role, parent in ((upper_collider, "touch_upper", hinge_control), (lower_collider, "orbit_closed", device_root)):
    collider["web_role"] = role
    collider["render_visible"] = False
    collider.hide_render = True
    parent_baked_mesh(collider, parent, hinge_axis if parent == hinge_control else None)

device_root.location = -hinge_axis

floor_material = make_material("Render_Floor", (0.026, 0.028, 0.035, 1.0), 0.42)
bpy.ops.mesh.primitive_plane_add(size=2.0, location=(0.0, 0.0, -0.013))
floor = bpy.context.object
floor.name = "Render_Floor"
replace_material(floor, floor_material)

bpy.ops.object.camera_add(location=(0.21, -0.245, 0.205))
camera = bpy.context.object
camera.name = "Render_Camera"
camera.data.lens = 58
camera.data.sensor_width = 36
look_at(camera, (0.0, 0.0, 0.035))
bpy.context.scene.camera = camera

for name, location, energy, size, color in (
    ("Key_Light", (-0.16, -0.14, 0.34), 9, 0.18, (1.0, 0.78, 0.92)),
    ("Fill_Light", (0.25, -0.02, 0.18), 5, 0.16, (0.72, 0.82, 1.0)),
    ("Rim_Light", (-0.08, 0.24, 0.25), 11, 0.14, (1.0, 0.35, 0.76)),
    ("Front_Fill_Light", (0.0, -0.22, 0.045), 7, 0.22, (1.0, 0.62, 0.9)),
):
    bpy.ops.object.light_add(type="AREA", location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy = energy
    light.data.shape = "DISK"
    light.data.size = size
    light.data.color = color
    look_at(light, (0.0, 0.0, 0.03))

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x = 1200
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "8"
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.world = bpy.data.worlds.get("Robinson_World") or bpy.data.worlds.new("Robinson_World")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.012, 0.014, 0.022, 1.0)
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.05
scene.view_settings.look = "AgX - Medium High Contrast"
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 90

def frame_camera(objects):
    corners = []
    for obj in objects:
        if obj.type == "MESH" and not obj.hide_render:
            corners.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    low = Vector(tuple(min(point[index] for point in corners) for index in range(3)))
    high = Vector(tuple(max(point[index] for point in corners) for index in range(3)))
    center = (low + high) * 0.5
    radius = (high - low).length * 0.5
    direction = Vector((1.05, 1.3, 1.0)).normalized()
    distance = max(0.24, radius / math.tan(camera.data.angle * 0.5) * 1.35)
    camera.location = center + direction * distance
    look_at(camera, center)


for frame, filename in ((1, "robinson-pink-closed.png"), (50, "robinson-pink-mid-open.png"), (90, "robinson-pink-open-170.png")):
    scene.frame_set(frame)
    frame_camera(imported_objects)
    scene.render.filepath = str(output_dir / filename)
    bpy.ops.render.render(write_still=True)

for obj in imported_objects:
    obj.hide_render = True
for collection in (internal_root, internal_lower, internal_upper):
    collection.hide_viewport = False
    collection.hide_render = False
for obj in internal_objects:
    obj.hide_set(False)
    obj.hide_render = False
scene.frame_set(60)
frame_camera(internal_objects)
scene.render.filepath = str(output_dir / "robinson-internal-layout.png")
bpy.ops.render.render(write_still=True)
for obj in imported_objects:
    obj.hide_render = obj.name in cavity_names
for obj in internal_objects:
    obj.hide_set(True)
    obj.hide_render = True
for collection in (internal_root, internal_lower, internal_upper):
    collection.hide_viewport = True
    collection.hide_render = True

scene.frame_set(1)
draft_blend = root_dir / "The Machine" / "Robinson_Web_Interaction_Internal_Draft.blend"
bpy.ops.wm.save_as_mainfile(filepath=str(draft_blend))

source_export_dir = output_dir / "optimization"
source_export_dir.mkdir(parents=True, exist_ok=True)


def select_for_export(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.hide_set(False)
        obj.select_set(True)
    bpy.context.view_layer.objects.active = device_root


exterior_export = [obj for obj in imported_objects if obj.name not in cavity_names]
exterior_export.extend((device_root, hinge_control, upper_collider, lower_collider, *plasticity_group_nodes.values()))
select_for_export(exterior_export)
bpy.ops.export_scene.gltf(
    filepath=str(source_export_dir / "robinson-exterior-uncompressed.glb"),
    export_format="GLB",
    use_selection=True,
    export_apply=False,
    export_animations=True,
    export_frame_range=True,
    export_extras=True,
    export_yup=True,
    export_tangents=False,
)

internal_export = list(internal_objects) + [device_root, hinge_control]
for collection in (internal_root, internal_lower, internal_upper):
    collection.hide_viewport = False
    collection.hide_render = False
select_for_export(internal_export)
bpy.ops.export_scene.gltf(
    filepath=str(output_dir / "robinson-internal-draft.glb"),
    export_format="GLB",
    use_selection=True,
    export_apply=False,
    export_animations=True,
    export_frame_range=True,
    export_extras=True,
    export_yup=True,
    export_tangents=False,
)

for obj in internal_objects:
    bpy.data.objects.remove(obj, do_unlink=True)
for collection in (internal_upper, internal_lower, internal_root):
    bpy.data.collections.remove(collection)
scene.frame_set(1)
final_blend = root_dir / "The Machine" / "Robinson_Web_Interaction.blend"
bpy.ops.wm.save_as_mainfile(filepath=str(final_blend))

scene.frame_set(90)
print(
    f"ROBINSON_BUILD_OK blend={final_blend} exterior={source_export_dir / 'robinson-exterior-uncompressed.glb'} "
    f"internal={output_dir / 'robinson-internal-draft.glb'} upper_objects={len(upper_objects)} "
    f"internal_draft={draft_blend} internal_objects={len(internal_objects)} "
    f"hinge_axis={tuple(round(value, 6) for value in hinge_axis)}"
)
