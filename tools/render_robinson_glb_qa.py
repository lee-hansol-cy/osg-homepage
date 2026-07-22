import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


arguments = sys.argv[sys.argv.index("--") + 1 :]
output_dir = Path(arguments[0]).resolve()
asset_paths = [Path(value).resolve() for value in arguments[1:]]
output_dir.mkdir(parents=True, exist_ok=True)


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def visible_meshes(objects):
    return [obj for obj in objects if obj.type == "MESH" and not obj.name.startswith("Interaction_Collider_")]


def bounds(objects):
    corners = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    low = Vector(tuple(min(point[index] for point in corners) for index in range(3)))
    high = Vector(tuple(max(point[index] for point in corners) for index in range(3)))
    return low, high


def remove_import(objects):
    for obj in objects:
        data = obj.data
        bpy.data.objects.remove(obj, do_unlink=True)
        if data and data.users == 0:
            if isinstance(data, bpy.types.Mesh):
                bpy.data.meshes.remove(data)
            elif isinstance(data, bpy.types.Material):
                bpy.data.materials.remove(data)


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x = 2400
scene.render.resolution_y = 2000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.image_settings.color_depth = "8"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.world = bpy.data.worlds.new("QA_World")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.012, 0.014, 0.022, 1.0)
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.05

bpy.ops.mesh.primitive_plane_add(size=2.0, location=(0.0, 0.0, -0.013))
floor = bpy.context.object
floor.name = "QA_Floor"
floor_material = bpy.data.materials.new("QA_Floor_Material")
floor_material.diffuse_color = (0.026, 0.028, 0.035, 1.0)
floor_material.use_nodes = True
floor_material.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.026, 0.028, 0.035, 1.0)
floor_material.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.42
floor.data.materials.append(floor_material)

bpy.ops.object.camera_add()
camera = bpy.context.object
camera.name = "QA_Camera"
camera.data.lens = 58
camera.data.sensor_width = 36
scene.camera = camera

for name, location, energy, size, color in (
    ("QA_Key", (-0.16, -0.14, 0.34), 9, 0.18, (1.0, 0.78, 0.92)),
    ("QA_Fill", (0.25, -0.02, 0.18), 5, 0.16, (0.72, 0.82, 1.0)),
    ("QA_Rim", (-0.08, 0.24, 0.25), 11, 0.14, (1.0, 0.35, 0.76)),
    ("QA_Front", (0.0, -0.22, 0.045), 7, 0.22, (1.0, 0.62, 0.9)),
):
    bpy.ops.object.light_add(type="AREA", location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy = energy
    light.data.shape = "DISK"
    light.data.size = size
    light.data.color = color
    look_at(light, (0.0, 0.0, 0.03))

fixed_camera = None
for index, asset_path in enumerate(asset_paths):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(asset_path))
    imported = [obj for obj in bpy.data.objects if obj not in before]
    meshes = visible_meshes(imported)
    for obj in imported:
        if obj.name.startswith("Interaction_Collider_"):
            obj.hide_render = True
    action_frames = [action.frame_range for action in bpy.data.actions if action.users]
    frame = sum(action_frames[0]) * 0.5 if action_frames else 1
    scene.frame_set(round(frame))
    bpy.context.view_layer.update()
    if fixed_camera is None:
        low, high = bounds(meshes)
        center = (low + high) * 0.5
        radius = (high - low).length * 0.5
        direction = Vector((1.05, 1.3, 1.0)).normalized()
        distance = max(0.24, radius / math.tan(camera.data.angle * 0.5) * 1.35)
        fixed_camera = center + direction * distance, center
    camera.location, target = fixed_camera
    look_at(camera, target)
    scene.render.filepath = str(output_dir / f"{index:02d}-{asset_path.stem}.png")
    bpy.ops.render.render(write_still=True)
    print(f"ROBINSON_QA_RENDER_OK asset={asset_path} output={scene.render.filepath} frame={frame:.3f}")
    remove_import(imported)
