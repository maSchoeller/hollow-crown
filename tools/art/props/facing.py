"""Normals as the board camera needs them: the game shades one-sided, so a visible face that points away from the camera comes out black.
Thin sheets, open tubes and the insides of shells are the usual culprits; recalc_face_normals cannot tell which side counts on them."""
import math

import bmesh
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def face_camera(obj, tilt=35.0):
    """Flips every face that the camera (tilt degrees from straight down, from the south, orthographic) sees from behind. Returns the count."""
    me = obj.data
    t = math.radians(tilt)
    to_cam = Vector((0.0, -math.sin(t), math.cos(t)))
    tree = BVHTree.FromPolygons([v.co.copy() for v in me.vertices], [tuple(p.vertices) for p in me.polygons], all_triangles=False)
    flip = []
    for p in me.polygons:
        if p.normal.dot(to_cam) > -0.02:
            continue
        c = p.center
        samples = [c] + [c.lerp(me.vertices[i].co, 0.8) for i in p.vertices]
        for s in samples:
            hit = tree.ray_cast(s + to_cam * 1e-3, to_cam)
            if hit[0] is None:
                flip.append(p.index)
                break
    if flip:
        bm = bmesh.new()
        bm.from_mesh(me)
        bm.faces.ensure_lookup_table()
        bmesh.ops.reverse_faces(bm, faces=[bm.faces[i] for i in flip])
        bm.to_mesh(me)
        bm.free()
        me.update()
    return len(flip)
