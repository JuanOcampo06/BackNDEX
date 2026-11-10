// Agrupa elementos que estan conectados entre si para saber que tramos de la red se pueden alcanzar unos a otros
export class UnionFind {
  private readonly padre = new Map<number, number>();

  raiz(elemento: number): number {
    if (!this.padre.has(elemento)) {
      this.padre.set(elemento, elemento);
    }
    let raiz = elemento;
    while (this.padre.get(raiz) !== raiz) {
      raiz = this.padre.get(raiz) as number;
    }
    // Deja a todos los del camino apuntando directo a la raiz para que la proxima busqueda sea rapida
    let actual = elemento;
    while (actual !== raiz) {
      const siguiente = this.padre.get(actual) as number;
      this.padre.set(actual, raiz);
      actual = siguiente;
    }
    return raiz;
  }

  // Junta los grupos de los dos elementos y devuelve true si eran grupos distintos
  unir(a: number, b: number): boolean {
    const raizA = this.raiz(a);
    const raizB = this.raiz(b);
    if (raizA === raizB) {
      return false;
    }
    this.padre.set(raizA, raizB);
    return true;
  }
}
