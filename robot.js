export class Robot {
  constructor(scene) {
    // Escala visual: 1 unidad Three.js = 10 cm
    // l1 = 50 cm → 5 unidades
    this.l1 = 5;

    // Base cilíndrica
    this.base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.8, 1, 32),
      new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 60 })
    );
    this.base.position.y = 0.5;

    // Eslabón 1 (brazo principal, gira en Y con q1)
    this.pivot1 = new THREE.Object3D();
    this.link1 = this._crearEslabon(this.l1, 0xff8af7, 0.45);
    this.pivot1.add(this.link1);
    this.base.add(this.pivot1);
    this.pivot1.position.y = 0.5;

    // Eslabón 2 (brazo secundario, gira en Z con q2)
    this.pivot2 = new THREE.Object3D();
    this.link2 = this._crearEslabon(3, 0x8800a3, 0.38);
    this.pivot2.add(this.link2);
    this.link1.add(this.pivot2);
    this.pivot2.position.y = this.l1;

    // Gripper/pinza (traslación con q3)
    this.pivot3 = new THREE.Object3D();
    this.gripper = this._crearGripper();
    this.pivot3.add(this.gripper);
    this.link2.add(this.pivot3);
    this.pivot3.position.y = 3;

    // Esfera articulación 1
    this._articulacion(this.link1, 0, this.l1, 0, 0x00e5ff);
    // Esfera articulación 2
    this._articulacion(this.pivot3, 0, 0, 0, 0x000000);

    scene.add(this.base);
  }

  _crearEslabon(longitud, color, radio = 0.4) {
    const geo = new THREE.CylinderGeometry(radio * 0.7, radio, longitud, 16);
    geo.translate(0, longitud / 2, 0);
    const mat = new THREE.MeshPhongMaterial({ color, shininess: 80 });
    return new THREE.Mesh(geo, mat);
  }

  _crearGripper() {
    const grupo = new THREE.Group();
    const cuerpo = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.8, 0.5),
      new THREE.MeshPhongMaterial({ color: 0xf0f0f0, shininess: 100 })
    );
    cuerpo.position.y = 0.4;
    grupo.add(cuerpo);
    [-0.2, 0.2].forEach(dx => {
      const dedo = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.5, 0.15),
        new THREE.MeshPhongMaterial({ color: 0xcccccc })
      );
      dedo.position.set(dx, 1.05, 0);
      grupo.add(dedo);
    });
    return grupo;
  }

  _articulacion(parent, x, y, z, color) {
    const esfera = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshPhongMaterial({ color, shininess: 120, emissive: color, emissiveIntensity: 0.15 })
    );
    esfera.position.set(x, y, z);
    parent.add(esfera);
  }

  /** q1[°], q2[°], q3[cm] → actualiza geometría */
  actualizar(q1deg, q2deg, q3cm) {
    const q1 = THREE.MathUtils.degToRad(q1deg);
    const q2 = THREE.MathUtils.degToRad(q2deg);
    this.base.rotation.y   =  q1;
    this.pivot2.rotation.z = -q2;
    this.pivot3.position.y =  3 + q3cm / 10;
  }

  /**
   * Cinemática directa → posición efector (cm)
   * px = q3·cos(q1)·sin(q2)
   * py = q3·sin(q1)·sin(q2)
   * pz = q3·cos(q2) + l1
   */
  getEfectorFinal(q1deg, q2deg, q3cm) {
    const q1 = THREE.MathUtils.degToRad(q1deg);
    const q2 = THREE.MathUtils.degToRad(q2deg);
    const l1 = 50;
    const px = q3cm * Math.cos(q1) * Math.sin(q2);
    const py = q3cm * Math.sin(q1) * Math.sin(q2);
    const pz = q3cm * Math.cos(q2) + l1;
    return { x: px, y: pz, z: py };
  }

  /**
   * Cinemática inversa derivada de 0T3
   * q1 = atan2(py, px)
   * q3 = sqrt(px²+py²+(pz-l1)²)
   * q2 = atan2(sqrt(px²+py²), pz-l1)
   * Nota: el robot usa x=px, y=pz, z=py (convención original)
   * así que aquí recibimos en ese orden: cinInv(x_ui, z_ui, y_ui)
   */
  cinematicaInversa(px, py, pz) {
    const l1 = 50;
    const q1  = Math.atan2(py, px);
    const dz  = pz - l1;
    const rxy = Math.sqrt(px * px + py * py);
    const q3  = Math.sqrt(rxy * rxy + dz * dz);
    const q2  = Math.atan2(rxy, dz);
    return {
      q1: THREE.MathUtils.radToDeg(q1),
      q2: THREE.MathUtils.radToDeg(q2),
      q3
    };
  }
}
