import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


asset = Path(sys.argv[sys.argv.index("--") + 1]).resolve()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(asset))

required_names = {
    "Robinson_Device_Root",
    "Hinge_Control_0_170deg",
    "상판",
    "하판",
    "상판 소속 화면",
    "상판 소속 화면 베젤",
    "좌 힌지",
    "우 힌지",
    "좌 힌지막대",
    "우 힌지막대",
    "Plasticity_Group__완충 고무",
    "카메라 렌즈",
    "카메라 중앙유리",
    "카메라 유리 검은색 베젤",
    "조도 센서",
    "마이크",
}
missing = sorted(required_names - set(bpy.data.objects.keys()))
if missing:
    raise RuntimeError("missing required nodes: " + ", ".join(missing))

internal_nodes = [obj.name for obj in bpy.data.objects if obj.get("web_role") == "internal_component"]
if internal_nodes:
    raise RuntimeError("exterior asset contains internal nodes: " + ", ".join(internal_nodes))

groups = [obj for obj in bpy.data.objects if obj.get("web_role") == "plasticity_group"]
if len(groups) != 15:
    raise RuntimeError(f"expected 15 Plasticity groups, got {len(groups)}")

hinge = bpy.data.objects["Hinge_Control_0_170deg"]
if hinge.get("axis") != "X" or abs(float(hinge.get("max_angle_deg", 0.0)) - 170.0) > 0.001:
    raise RuntimeError("hinge metadata is invalid")

upper_screen = bpy.data.objects["상판 소속 화면"]
if upper_screen.get("web_role") != "screen_upper_ui" or not upper_screen.get("touch_enabled"):
    raise RuntimeError("upper screen UI metadata is invalid")

scene = bpy.context.scene
upper = bpy.data.objects["상판"]
action = hinge.animation_data.action if hinge.animation_data else None
if action is None:
    raise RuntimeError("hinge animation action is missing")
start_frame, end_frame = action.frame_range
sample_frames = [start_frame + (end_frame - start_frame) * ratio for ratio in (0.0, 1 / 3, 2 / 3, 1.0)]
centers = []
for frame in sample_frames:
    scene.frame_set(round(frame))
    corners = [upper.matrix_world @ Vector(corner) for corner in upper.bound_box]
    center = sum(corners, Vector()) / 8
    centers.append(center)
radius_values = [math.hypot(center.y, center.z) for center in centers]
radius_error = max(radius_values) - min(radius_values)
if radius_error > 0.00005:
    raise RuntimeError(f"upper panel does not preserve hinge radius: {radius_error}")

rod_centers = {}
for frame in (start_frame, end_frame):
    scene.frame_set(round(frame))
    rod_centers[frame] = []
    for name in ("좌 힌지막대", "우 힌지막대"):
        rod = bpy.data.objects[name]
        corners = [rod.matrix_world @ Vector(corner) for corner in rod.bound_box]
        rod_centers[frame].append(sum(corners, Vector()) / 8)
rod_drift = max((end - start).length for start, end in zip(rod_centers[start_frame], rod_centers[end_frame]))
if rod_drift > 0.00005:
    raise RuntimeError(f"hinge rod axis drift is {rod_drift}")

scene.frame_set(round(start_frame))
closed_rotation = hinge.matrix_local.to_quaternion()
scene.frame_set(round(end_frame))
open_rotation = hinge.matrix_local.to_quaternion()
angle_degrees = math.degrees(closed_rotation.rotation_difference(open_rotation).angle)
if abs(angle_degrees - 170.0) > 0.05:
    raise RuntimeError(f"hinge range is {angle_degrees} degrees")

mesh_objects = [obj for obj in bpy.data.objects if obj.type == "MESH"]
vertices = sum(len(obj.data.vertices) for obj in mesh_objects)
polygons = sum(len(obj.data.polygons) for obj in mesh_objects)
print(
    f"ROBINSON_WEB_VERIFY_OK asset={asset} objects={len(bpy.data.objects)} groups={len(groups)} "
    f"mesh_objects={len(mesh_objects)} vertices={vertices} polygons={polygons} "
    f"hinge_degrees={angle_degrees:.3f} radius_error_m={radius_error:.8f} "
    f"rod_drift_m={rod_drift:.8f} screen_role={upper_screen.get('web_role')} "
    f"internal_nodes={len(internal_nodes)} action_frames=({start_frame:.2f},{end_frame:.2f})"
)
