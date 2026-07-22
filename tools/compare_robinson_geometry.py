import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector, kdtree


arguments = sys.argv[sys.argv.index("--") + 1 :]
baseline_path = Path(arguments[0]).resolve()
candidate_paths = [Path(value).resolve() for value in arguments[1:]]


def load_asset(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(path))
    bpy.context.scene.frame_set(1)
    meshes = {}
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        matrix = obj.matrix_world.copy()
        normal_matrix = matrix.to_3x3()
        positions = [matrix @ vertex.co for vertex in obj.data.vertices]
        normals = [(normal_matrix @ vertex.normal).normalized() for vertex in obj.data.vertices]
        meshes[obj.name] = (positions, normals, len(obj.data.polygons))
    return meshes


baseline = load_asset(baseline_path)
baseline_vertices = sum(len(value[0]) for value in baseline.values())
baseline_polygons = sum(value[2] for value in baseline.values())

for candidate_path in candidate_paths:
    candidate = load_asset(candidate_path)
    if set(candidate) != set(baseline):
        missing = sorted(set(baseline) - set(candidate))
        extra = sorted(set(candidate) - set(baseline))
        raise RuntimeError(f"node mismatch for {candidate_path}: missing={missing} extra={extra}")

    squared_error = 0.0
    compared_vertices = 0
    max_distance = 0.0
    max_normal_angle = 0.0
    reordered_objects = 0
    candidate_vertex_total = 0
    vertex_count_delta = 0
    object_deviations = []
    for name, (baseline_positions, baseline_normals, baseline_polygon_count) in baseline.items():
        candidate_positions, candidate_normals, candidate_polygon_count = candidate[name]
        candidate_vertex_total += len(candidate_positions)
        vertex_count_delta += abs(len(candidate_positions) - len(baseline_positions))
        if candidate_polygon_count != baseline_polygon_count:
            raise RuntimeError(
                f"topology mismatch for {candidate_path} object={name} "
                f"vertices={len(candidate_positions)}/{len(baseline_positions)} "
                f"polygons={candidate_polygon_count}/{baseline_polygon_count}"
            )

        direct_max = max(((candidate_position - baseline_position).length for candidate_position, baseline_position in zip(candidate_positions, baseline_positions)), default=0.0)
        if len(candidate_positions) == len(baseline_positions) and direct_max <= 1e-9:
            matches = range(len(candidate_positions))
        else:
            reordered_objects += 1
            tree = kdtree.KDTree(len(baseline_positions))
            for index, position in enumerate(baseline_positions):
                tree.insert(position, index)
            tree.balance()
            matches = [tree.find(position)[1] for position in candidate_positions]

        object_max_distance = 0.0
        for candidate_index, baseline_index in enumerate(matches):
            distance = (candidate_positions[candidate_index] - baseline_positions[baseline_index]).length
            squared_error += distance * distance
            compared_vertices += 1
            max_distance = max(max_distance, distance)
            object_max_distance = max(object_max_distance, distance)
            dot = max(-1.0, min(1.0, candidate_normals[candidate_index].dot(baseline_normals[baseline_index])))
            max_normal_angle = max(max_normal_angle, math.degrees(math.acos(dot)))

        if len(candidate_positions) != len(baseline_positions):
            candidate_tree = kdtree.KDTree(len(candidate_positions))
            for index, position in enumerate(candidate_positions):
                candidate_tree.insert(position, index)
            candidate_tree.balance()
            for position in baseline_positions:
                reverse_distance = candidate_tree.find(position)[2]
                max_distance = max(max_distance, reverse_distance)
                object_max_distance = max(object_max_distance, reverse_distance)
        object_deviations.append((object_max_distance, name))

    rms_distance = math.sqrt(squared_error / compared_vertices)
    print(
        f"GEOMETRY_COMPARE_OK candidate={candidate_path} mesh_objects={len(candidate)} "
        f"vertices={candidate_vertex_total}/{baseline_vertices} vertex_count_delta={vertex_count_delta} polygons={baseline_polygons} "
        f"max_position_um={max_distance * 1_000_000:.6f} rms_position_um={rms_distance * 1_000_000:.6f} "
        f"max_normal_deg={max_normal_angle:.6f} reordered_objects={reordered_objects}"
    )
    print("GEOMETRY_WORST " + " | ".join(f"{name}:{distance * 1_000_000:.3f}um" for distance, name in sorted(object_deviations, reverse=True)[:8]))
