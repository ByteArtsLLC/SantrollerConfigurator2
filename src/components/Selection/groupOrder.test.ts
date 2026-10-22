import { describe, expect, it } from 'vitest';
import {
  applyOrder,
  dragOrder,
  groupSortingStrategy,
  groupToEndOrder,
  groupToStartOrder,
  reorderIndexes,
  withoutGroupOrder,
} from './groupOrder';

const letters = (order: number[]) => applyOrder(['a', 'b', 'c', 'd', 'e', 'f'], order).join('');

describe('dragging a group', () => {
  it('moves a card that is not selected on its own', () => {
    expect(letters(dragOrder(6, [0, 1], 4, 2))).toBe('abecdf');
  });

  it('brings the rest of the selection along when dragging down', () => {
    // b and d dragged onto e land after it, in their old order
    expect(letters(dragOrder(6, [1, 3], 1, 4))).toBe('acebdf');
  });

  it('brings the rest of the selection along when dragging up', () => {
    // c and f dragged onto b land before it
    expect(letters(dragOrder(6, [2, 5], 5, 1))).toBe('acfbde');
  });

  it('lands where the dragged card was dropped when that is another of the group', () => {
    // b dragged onto d passes c, so the group ends up after it
    expect(letters(dragOrder(6, [1, 3], 1, 3))).toBe('acbdef');
    // the last of a group dropped on the one before it stays put
    expect(letters(dragOrder(4, [2, 3], 2, 3))).toBe('abcd');
  });
});

describe('group orders', () => {
  it('moves a group to the start or end, keeping its order', () => {
    expect(letters(groupToStartOrder(6, [4, 1]))).toBe('beacdf');
    expect(letters(groupToEndOrder(6, [4, 1]))).toBe('acdfbe');
  });

  it('removes a group', () => {
    expect(letters(withoutGroupOrder(6, [0, 5]))).toBe('bcde');
  });

  it('follows indexes through a reorder, dropping removed ones', () => {
    expect([...reorderIndexes([1, 4], groupToStartOrder(6, [4, 1]))].sort()).toEqual([0, 1]);
    expect([...reorderIndexes([0, 2], withoutGroupOrder(6, [0]))]).toEqual([1]);
  });
});

describe('previewing a group drag', () => {
  // Four cards in a row, 100px apart
  const rects = [0, 1, 2, 3].map((i) => ({
    top: 0,
    left: i * 100,
    width: 90,
    height: 50,
    right: i * 100 + 90,
    bottom: 50,
  }));
  const shifts = (group: number[], activeIndex: number, overIndex: number) =>
    rects.map(
      (_, index) =>
        groupSortingStrategy(group)({ rects, activeIndex, overIndex, index, activeNodeRect: null })
          ?.x
    );

  it('leaves a group alone when dropped where it already is', () => {
    expect(shifts([2, 3], 2, 3)).toEqual([0, 0, 0, 0]);
  });

  it('moves every card to where it will be dropped', () => {
    // c and d dragged onto b end up as a, c, d, b
    expect(shifts([2, 3], 2, 1)).toEqual([0, 200, -100, -100]);
  });
});
