import { vi, beforeEach, describe, test, expect } from "vitest";
import * as fc from "fast-check";
import { Deck } from "./Deck.mjs";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("constructor", () => {
  test("initializes to empty deck with no args", () => {
    const deck = new Deck();
    expect(deck.isEmpty()).toEqual(true);
  });

  test("initializes to whatever deck was passed to it", () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (data) => {
        const deck = new Deck(data);
        expect(deck.toList()).toEqual(data);
      }),
    );
  });
});

describe("shuffle", () => {
  test("shuffles deck", () => {
    // fake shuffling
    const random = vi.spyOn(Math, "random");
    random.mockReturnValue(0.5);

    const deck = new Deck([1, 2, 3, 4]);
    deck.shuffle();

    expect(deck.toList()).toEqual([1, 4, 2, 3]);
  });

  test("calls Math.random exactly n-1 times for n cards", () => {
    const random = vi.spyOn(Math, "random");
    random.mockReturnValue(0.5);

    const deck = new Deck([1, 2, 3, 4, 5]);
    deck.shuffle();

    // Fisher-Yates should call random n-1 times for n elements
    expect(random).toHaveBeenCalledTimes(4);
  });

  test("does not modify empty deck", () => {
    const random = vi.spyOn(Math, "random");
    const deck = new Deck<number>([]);
    deck.shuffle();

    expect(deck.toList()).toEqual([]);
    expect(random).not.toHaveBeenCalled();
  });

  test("does not modify single card deck", () => {
    const random = vi.spyOn(Math, "random");
    const deck = new Deck([42]);
    deck.shuffle();

    expect(deck.toList()).toEqual([42]);
    expect(random).not.toHaveBeenCalled();
  });

  test("can produce different orderings with different random values", () => {
    // Test that different random values produce different results
    const random = vi.spyOn(Math, "random");

    // First shuffle - always choose last element
    random.mockReturnValue(0.99);
    const deck1 = new Deck([1, 2, 3]);
    deck1.shuffle();
    const result1 = deck1.toList();

    // Second shuffle - always choose first element
    random.mockReturnValue(0.01);
    const deck2 = new Deck([1, 2, 3]);
    deck2.shuffle();
    const result2 = deck2.toList();

    // Results should be different
    expect(result1).not.toEqual(result2);
  });
});

describe("draw", () => {
  test("returns null when there are no cards in the deck", () => {
    const deck = new Deck();
    expect(deck.draw()).toBeNull();
  });

  test("draws the top card", () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { minLength: 1 }), (data) => {
        const deck = new Deck(data);
        const card = deck.draw();
        expect(card).toEqual(data.at(-1));
        expect(deck.toList()).toEqual(data.slice(0, -1));
      }),
    );
  });
});

describe("drawMany", () => {
  test("errors when count < 0", () => {
    fc.assert(
      fc.property(fc.integer({ max: -1 }), (n) => {
        const deck = new Deck();
        expect(() => deck.drawMany(n)).toThrowError(
          "Count must be non-negative",
        );
      }),
    );
  });

  test("does not error when count is 0", () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { minLength: 1 }), (data) => {
        const deck = new Deck(data);
        const hand = deck.drawMany(0);
        expect(hand).toEqual([]);
      }),
    );
  });

  test("returns an empty list when there are no cards in the deck", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1 }), (n) => {
        const deck = new Deck();
        expect(deck.drawMany(n)).toEqual([]);
      }),
    );
  });

  test("draws the top n cards in the deck", () => {
    fc.assert(
      fc.property(
        // 1. Generate the array first
        fc.array(fc.string(), { minLength: 2 }).chain((data) =>
          // 2. Return a new arbitrary that pairs the array with a valid 'n'
          fc.record({
            data: fc.constant(data),
            n: fc.integer({ min: 1, max: data.length }),
          }),
        ),
        ({ data, n }) => {
          const deck = new Deck(data);
          const hand = deck.drawMany(n);
          expect(hand.length).toEqual(n);
          expect(hand).toEqual(data.slice(-n).toReversed());
        },
      ),
    );
  });

  test("returns the rest of the deck if the count exceeds the cards remaining", () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { minLength: 1 }), (data) => {
        const deck = new Deck(data);
        const hand = deck.drawMany(data.length + 5);
        expect(hand).toEqual(data.toReversed());
      }),
    );
  });
});

describe("pull", () => {
  test("returns null for an empty deck", () => {
    const deck = new Deck();
    expect(deck.pull(() => true)).toEqual(null);
  });

  test("draws first card that matches the predicate", () => {
    const deck = new Deck([1, 2, 3, 4, 5]);
    const card = deck.pull((c) => c % 2 === 0);

    expect(deck.toList()).toEqual([1, 2, 3, 5]);
    expect(card).toEqual(4);
  });
});

describe("pullMany", () => {
  test("returns empty list for an empty deck", () => {
    const deck = new Deck();
    expect(deck.pullMany(2, () => true)).toEqual([]);
  });

  test("draws empty list for count = 0", () => {
    const deck = new Deck();
    expect(deck.pullMany(0, () => true)).toEqual([]);
  });

  test("draws first cards that match a predicate", () => {
    const deck = new Deck([1, 2, 3, 4, 5, 6, 7]);
    const cards = deck.pullMany(2, (c) => c % 2 === 0);

    expect(deck.toList()).toEqual([1, 2, 3, 5, 7]);
    expect(cards).toEqual([6, 4]);
  });

  test("throws error on count < 0", () => {
    const deck = new Deck();
    expect(() => deck.pullMany(-1, () => true)).toThrowError(
      "Count must be non-negative.",
    );
  });
});

describe("pullAll", () => {
  test("pulls empty list if no cards in deck", () => {
    const deck = new Deck();
    expect(deck.pullAll(() => true)).toEqual([]);
  });

  test("pulls all cards that match a predicate from the deck", () => {
    const deck = new Deck([1, 2, 3, 4, 5, 6, 7, 8]);
    const pulled = deck.pullAll((c) => c % 2 === 0);

    expect(pulled).toEqual([8, 6, 4, 2]);
    expect(deck.toList()).toEqual([1, 3, 5, 7]);
  });
});

describe("peek", () => {
  test("returns null when there are no cards in the deck", () => {
    const deck = new Deck();
    expect(deck.peek()).toBeNull();
  });

  test("draws the top card", () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { minLength: 1 }), (data) => {
        const deck = new Deck(data);
        const card = deck.peek();
        expect(card).toEqual(data.at(-1));
        expect(deck.toList()).toEqual(data);
      }),
    );
  });
});

describe("peekMany", () => {
  test("errors when count < 0", () => {
    fc.assert(
      fc.property(fc.integer({ max: -1 }), (n) => {
        const deck = new Deck();
        expect(() => deck.peekMany(n)).toThrowError(
          "Count must be non-negative",
        );
      }),
    );
  });

  test("returns empty list when count is 0", () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { minLength: 1 }), (data) => {
        const deck = new Deck(data);
        const hand = deck.peekMany(0);
        expect(hand).toEqual([]);
      }),
    );
  });

  test("peeks at the top cards in order", () => {
    fc.assert(
      fc.property(
        // 1. Generate the array first
        fc.array(fc.string(), { minLength: 2 }).chain((data) =>
          // 2. Return a new arbitrary that pairs the array with a valid 'n'
          fc.record({
            data: fc.constant(data),
            n: fc.integer({ min: 1, max: data.length }),
          }),
        ),
        ({ data, n }) => {
          const deck = new Deck(data);
          const hand = deck.peekMany(n);
          expect(hand.length).toEqual(n);
          expect(hand).toEqual(data.slice(-n));
        },
      ),
    );
  });
});

describe("placeOnTop", () => {
  test("adds card to the top of the deck", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string()).chain((data) =>
          fc.record({
            data: fc.constant(data),
            card: fc.string(),
          }),
        ),
        ({ data, card }) => {
          const deck = new Deck(data);
          deck.placeOnTop(card);
          expect(deck.toList().at(-1)).toEqual(card);
        },
      ),
    );
  });
});

describe("placeOnBottom", () => {
  test("adds card to the top of the deck", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string()).chain((data) =>
          fc.record({
            data: fc.constant(data),
            card: fc.string(),
          }),
        ),
        ({ data, card }) => {
          const deck = new Deck(data);
          deck.placeOnBottom(card);
          expect(deck.toList().at(0)).toEqual(card);
        },
      ),
    );
  });
});

describe("remove", () => {
  test("filters deck", () => {
    const deck = new Deck([1, 2, 3, 4]);
    deck.remove((c) => c > 2);
    expect(deck.toList()).toEqual([1, 2]);
  });
});

describe("isEmpty", () => {
  test("properly reports as empty", () => {
    const deck = new Deck();
    expect(deck.isEmpty()).toEqual(true);
  });

  test("properly reports as not empty", () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { minLength: 1 }), (data) => {
        const deck = new Deck(data);
        expect(deck.isEmpty()).toEqual(false);
      }),
    );
  });
});

describe("size", () => {
  test("properly determines size of deck", () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (data) => {
        const deck = new Deck(data);
        expect(deck.size()).toEqual(data.length);
      }),
    );
  });
});

describe("toList", () => {
  test("generates list properly", () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (data) => {
        const deck = new Deck(data);
        expect(deck.toList()).toEqual(data); // should equal
        expect(deck.toList()).not.toBe(data); // but not be the same object
      }),
    );
  });
});
