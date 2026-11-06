// Falsos de three, del documento y de la ventana para probar en Node sin navegador ni dependencias.

class Vector3D {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
}

class Objeto3D {
  constructor() {
    this.position = new Vector3D();
    this.rotation = new Vector3D();
    this.scale = { x: 1, y: 1, z: 1 };
    this.userData = {};
    this.visible = true;
    this.children = [];
  }
  add(hijo) {
    this.children.push(hijo);
    return this;
  }
  remove(hijo) {
    const posicion = this.children.indexOf(hijo);
    if (posicion >= 0) this.children.splice(posicion, 1);
    return this;
  }
}

class Geometria {
  constructor(...argumentos) {
    this.argumentos = argumentos;
    this.liberada = false;
  }
  dispose() {
    this.liberada = true;
  }
}

class Material {
  constructor(opciones = {}) {
    this.opciones = opciones;
    this.liberado = false;
  }
  dispose() {
    this.liberado = true;
  }
}

export function crearThreeFalso() {
  class Malla extends Objeto3D {
    constructor(geometry, material) {
      super();
      this.geometry = geometry;
      this.material = material;
    }
  }
  class Camara extends Objeto3D {
    constructor(fov, aspect) {
      super();
      this.aspect = aspect;
    }
    updateProjectionMatrix() {}
  }
  class Renderizador {
    constructor(opciones) {
      this.opciones = opciones;
      this.domElement = { falso: 'canvas' };
      this.tamano = null;
      this.dibujos = 0;
      this.ultimo = null;
    }
    setPixelRatio(ratio) {
      this.ratio = ratio;
    }
    setSize(ancho, alto) {
      this.tamano = [ancho, alto];
    }
    render(escena, camara) {
      this.dibujos++;
      this.ultimo = { escena, camara };
    }
  }

  return {
    Scene: class extends Objeto3D {},
    Group: class extends Objeto3D {},
    Mesh: Malla,
    PerspectiveCamera: Camara,
    WebGLRenderer: Renderizador,
    Color: class {
      constructor(valor) {
        this.valor = valor;
      }
    },
    Fog: class {
      constructor(...argumentos) {
        this.argumentos = argumentos;
      }
    },
    HemisphereLight: class extends Objeto3D {},
    DirectionalLight: class extends Objeto3D {},
    MeshLambertMaterial: Material,
    BoxGeometry: Geometria,
    PlaneGeometry: Geometria
  };
}

export function crearDocumentoFalso() {
  const elementos = new Map();
  return {
    elementos,
    body: {
      hijos: [],
      appendChild(hijo) {
        this.hijos.push(hijo);
      }
    },
    getElementById(id) {
      if (!elementos.has(id)) elementos.set(id, { id, style: {}, textContent: '' });
      return elementos.get(id);
    }
  };
}

export function crearVentanaFalsa() {
  const ventana = new EventTarget();
  return Object.assign(ventana, {
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1,
    temporizadores: [],
    setTimeout(funcion) {
      this.temporizadores.push(funcion);
      return this.temporizadores.length;
    },
    clearTimeout() {}
  });
}

// Lanza un evento de teclado (o cualquier otro con "code") sobre un objetivo.
export function pulsar(objetivo, tipo, code, extra = {}) {
  const evento = Object.assign(new Event(tipo, { cancelable: true }), { code, repeat: false }, extra);
  objetivo.dispatchEvent(evento);
  return evento;
}
