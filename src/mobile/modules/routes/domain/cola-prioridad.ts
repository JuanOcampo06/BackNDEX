interface Elemento {
  nodo: number;
  costo: number;
}

// Cola donde siempre sale primero el elemento de menor costo y la usa el calculo del camino mas barato
export class ColaPrioridad {
  private readonly elementos: Elemento[] = [];

  get vacia(): boolean {
    return this.elementos.length === 0;
  }

  agregar(nodo: number, costo: number): void {
    this.elementos.push({ nodo, costo });
    let i = this.elementos.length - 1;
    while (i > 0) {
      const padre = (i - 1) >> 1;
      if (this.elementos[padre].costo <= this.elementos[i].costo) {
        break;
      }
      this.intercambiar(i, padre);
      i = padre;
    }
  }

  sacar(): Elemento {
    const primero = this.elementos[0];
    const ultimo = this.elementos.pop() as Elemento;
    if (this.elementos.length > 0) {
      this.elementos[0] = ultimo;
      this.hundir();
    }
    return primero;
  }

  private hundir(): void {
    let i = 0;
    for (;;) {
      const izquierdo = 2 * i + 1;
      const derecho = izquierdo + 1;
      let menor = i;
      if (izquierdo < this.elementos.length && this.elementos[izquierdo].costo < this.elementos[menor].costo) menor = izquierdo;
      if (derecho < this.elementos.length && this.elementos[derecho].costo < this.elementos[menor].costo) menor = derecho;
      if (menor === i) {
        return;
      }
      this.intercambiar(i, menor);
      i = menor;
    }
  }

  private intercambiar(i: number, j: number): void {
    [this.elementos[i], this.elementos[j]] = [this.elementos[j], this.elementos[i]];
  }
}
