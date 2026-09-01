export function createBox(width, height, depth, { x = 0, y = 0, z = 0 } = {}) {
  const hx = width / 2;
  const hy = height / 2;
  const hz = depth / 2;
  const positions = [];
  const uvs = [];
  const faces = [
    // +Z
    [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]],
    // -Z
    [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]],
    // +X
    [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]],
    // -X
    [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]],
    // +Y
    [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]],
    // -Y
    [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]],
  ];
  const indices = [];
  for (let face = 0; face < faces.length; face += 1) {
    const base = face * 4;
    for (const [px, py, pz] of faces[face]) {
      positions.push(px + x, py + y, pz + z);
    }
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return withNormals({ positions, indices, uvs, name: "box" });
}

export function createSphere(radius, segments = 12, { x = 0, y = 0, z = 0, latScale = 1 } = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let lat = 0; lat <= segments; lat += 1) {
    const theta = (lat * Math.PI) / segments;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    for (let lon = 0; lon <= segments; lon += 1) {
      const phi = (lon * 2 * Math.PI) / segments;
      positions.push(
        x + radius * Math.cos(phi) * sinTheta,
        y + radius * cosTheta * latScale,
        z + radius * Math.sin(phi) * sinTheta,
      );
      uvs.push(lon / segments, lat / segments);
    }
  }
  for (let lat = 0; lat < segments; lat += 1) {
    for (let lon = 0; lon < segments; lon += 1) {
      const a = lat * (segments + 1) + lon;
      const b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return withNormals({ positions, indices, uvs, name: "sphere" });
}

export function createCylinder(radiusTop, radiusBottom, height, segments = 12, { x = 0, y = 0, z = 0 } = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const angle = t * Math.PI * 2;
    const cx = Math.cos(angle);
    const cz = Math.sin(angle);
    positions.push(x + cx * radiusTop, y + height / 2, z + cz * radiusTop);
    uvs.push(t, 1);
    positions.push(x + cx * radiusBottom, y - height / 2, z + cz * radiusBottom);
    uvs.push(t, 0);
  }
  for (let i = 0; i < segments; i += 1) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const topCenter = positions.length / 3;
  positions.push(x, y + height / 2, z);
  uvs.push(0.5, 0.5);
  const bottomCenter = positions.length / 3;
  positions.push(x, y - height / 2, z);
  uvs.push(0.5, 0.5);
  for (let i = 0; i < segments; i += 1) {
    const a = i * 2;
    indices.push(topCenter, a + 2, a);
    indices.push(bottomCenter, a + 1, a + 3);
  }
  return withNormals({ positions, indices, uvs, name: "cylinder" });
}

export function createTube(points, radius, segments = 6) {
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let p = 0; p < points.length; p += 1) {
    const prev = points[Math.max(0, p - 1)];
    const next = points[Math.min(points.length - 1, p + 1)];
    const tx = next[0] - prev[0];
    const ty = next[1] - prev[1];
    const tz = next[2] - prev[2];
    const length = Math.hypot(tx, ty, tz) || 1;
    const nx = tx / length;
    const ny = ty / length;
    const nz = tz / length;
    const ax = Math.abs(nx) < 0.9 ? 1 : 0;
    let bx = ny * 0 - nz * ax;
    let by = nz * ax - nx * 0;
    let bz = nx * ax - ny * 0;
    const bl = Math.hypot(bx, by, bz) || 1;
    bx /= bl;
    by /= bl;
    bz /= bl;
    const cx = ny * bz - nz * by;
    const cy = nz * bx - nx * bz;
    const cz = nx * by - ny * bx;
    for (let s = 0; s <= segments; s += 1) {
      const angle = (s / segments) * Math.PI * 2;
      const ox = Math.cos(angle) * radius;
      const oy = Math.sin(angle) * radius;
      positions.push(
        points[p][0] + bx * ox + cx * oy,
        points[p][1] + by * ox + cy * oy,
        points[p][2] + bz * ox + cz * oy,
      );
      uvs.push(p / (points.length - 1), s / segments);
    }
  }
  const ring = segments + 1;
  for (let p = 0; p < points.length - 1; p += 1) {
    for (let s = 0; s < segments; s += 1) {
      const a = p * ring + s;
      const b = a + ring;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return withNormals({ positions, indices, uvs, name: "tube" });
}

export function mergeMeshes(meshes, name = "merged") {
  const positions = [];
  const indices = [];
  const uvs = [];
  let offset = 0;
  for (const mesh of meshes) {
    positions.push(...mesh.positions);
    uvs.push(...mesh.uvs);
    for (const index of mesh.indices) {
      indices.push(index + offset);
    }
    offset += mesh.positions.length / 3;
  }
  return withNormals({ positions, indices, uvs, name });
}

export function withNormals(mesh) {
  const normals = new Array(mesh.positions.length).fill(0);
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const ia = mesh.indices[i] * 3;
    const ib = mesh.indices[i + 1] * 3;
    const ic = mesh.indices[i + 2] * 3;
    const ax = mesh.positions[ia];
    const ay = mesh.positions[ia + 1];
    const az = mesh.positions[ia + 2];
    const bx = mesh.positions[ib];
    const by = mesh.positions[ib + 1];
    const bz = mesh.positions[ib + 2];
    const cx = mesh.positions[ic];
    const cy = mesh.positions[ic + 1];
    const cz = mesh.positions[ic + 2];
    const ux = bx - ax;
    const uy = by - ay;
    const uz = bz - az;
    const vx = cx - ax;
    const vy = cy - ay;
    const vz = cz - az;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    normals[ia] += nx;
    normals[ia + 1] += ny;
    normals[ia + 2] += nz;
    normals[ib] += nx;
    normals[ib + 1] += ny;
    normals[ib + 2] += nz;
    normals[ic] += nx;
    normals[ic + 1] += ny;
    normals[ic + 2] += nz;
  }
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= length;
    normals[i + 1] /= length;
    normals[i + 2] /= length;
  }
  return { ...mesh, normals };
}

export function boundsOf(mesh) {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < mesh.positions.length; i += 3) {
    minX = Math.min(minX, mesh.positions[i]);
    maxX = Math.max(maxX, mesh.positions[i]);
    minY = Math.min(minY, mesh.positions[i + 1]);
    maxY = Math.max(maxY, mesh.positions[i + 1]);
    minZ = Math.min(minZ, mesh.positions[i + 2]);
    maxZ = Math.max(maxZ, mesh.positions[i + 2]);
  }
  return {
    minX, minY, minZ, maxX, maxY, maxZ,
    width: maxX - minX,
    height: maxY - minY,
    depth: maxZ - minZ,
  };
}

export function vertexCount(mesh) {
  return mesh.positions.length / 3;
}
