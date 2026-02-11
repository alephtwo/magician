/**
 * A Deck is a collection of items that can be shuffled and drawn from.
 * Items are always drawn from the "top" of the deck in a defined order, but the
 * deck can be shuffled to change the order of the items.
 */
export class Deck<T> {
  #cards: T[];

  /**
   * Creates a new deck with the given cards.
   * @param cards The cards to initialize the deck with. Defaults to an empty array.
   */
  constructor(cards: T[] = []) {
    this.#cards = cards;
  }

  /**
   * Shuffles the deck in place using the Fisher-Yates algorithm.
   * This randomly reorders all cards in the deck.
   */
  shuffle(): void {
    for (let i = this.#cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.#cards[i], this.#cards[j]] = [this.#cards[j], this.#cards[i]];
    }
  }

  /**
   * Draws (removes and returns) the top card from the deck.
   * @returns The top card, or null if the deck is empty.
   */
  draw(): T | null {
    if (this.#cards.length === 0) {
      return null;
    }
    return this.#cards.pop();
  }

  /**
   * Draws a specified number of cards from the top of the deck.
   * The cards are removed from the deck.
   * If the count is greater than the number of cards in the deck, all remaining
   * cards will be drawn.
   * @param count The number of cards to draw from the deck.
   * @returns An array of the drawn cards. The array may be shorter than the
   *          requested count if the deck does not contain enough cards.
   * @throws Error if count is negative.
   */
  drawMany(count: number): T[] {
    if (count < 0) {
      throw new Error("Count must be non-negative");
    }
    return Array.from({ length: count }, () => this.draw()).filter(
      (c) => c !== null,
    );
  }

  /**
   * Peeks at the top card without removing it from the deck.
   * @returns The top card, or null if the deck is empty.
   */
  peek(): T | null {
    if (this.#cards.length === 0) {
      return null;
    }
    return this.#cards.at(-1);
  }

  /**
   * Peeks at a specified number of cards from the top of the deck without removing them.
   * If the count is greater than the number of cards in the deck, all cards will be returned.
   * @param count The number of cards to peek at from the deck.
   * @returns An array of the cards from the top of the deck. The array may be shorter than the
   *          requested count if the deck does not contain enough cards.
   * @throws Error if count is negative.
   */
  peekMany(count: number): T[] {
    if (count < 0) {
      throw new Error("Count must be non-negative");
    }
    return this.#cards.slice(-count);
  }

  /**
   * Places a card on top of the deck.
   * The card will be the next one drawn.
   * @param card The card to place on top of the deck.
   */
  placeOnTop(card: T): void {
    this.#cards.push(card);
  }

  /**
   * Places a card on the bottom of the deck.
   * The card will be the last one drawn.
   * @param card The card to place on the bottom of the deck.
   */
  placeOnBottom(card: T): void {
    this.#cards.unshift(card);
  }

  /**
   * Removes cards from the deck that match the given predicate.
   * @param predicate A function that takes a card and returns true if the card should be removed, false otherwise.
   */
  remove(predicate: (card: T) => boolean): void {
    this.#cards = this.#cards.filter((card) => !predicate(card));
  }

  /**
   * Checks if the deck is empty.
   * @returns True if the deck contains no cards, false otherwise.
   */
  isEmpty(): boolean {
    return this.#cards.length === 0;
  }

  /**
   * Returns the number of cards currently in the deck.
   * @returns The number of cards in the deck.
   */
  size(): number {
    return this.#cards.length;
  }

  /**
   * Returns a list of the cards currently in the deck, in order from top to bottom.
   * The returned list is a copy and can be modified without affecting the deck.
   * @returns A list of the cards in the deck.
   */
  toList(): T[] {
    return [...this.#cards];
  }

  /**
   * Makes the deck iterable, drawing cards one by one from the top until empty.
   * Each iteration removes a card from the deck.
   */
  *[Symbol.iterator](): IterableIterator<T> {
    for (let i = this.#cards.length; i > 0; i--) {
      yield this.draw();
    }
  }
}
