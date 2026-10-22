import { arrayMove, type SortingStrategy } from '@dnd-kit/sortable';

// Orders are a list's items as their old indexes, in their new positions. Leaving an index out
// removes that item.

// Dragging `from` onto `to`. `from` lands where it would on its own, as the sortable preview showed
// it, and when it's in `group` the rest of the group gathers around it, in the order it was in.
export function dragOrder(count: number, group: number[], from: number, to: number): number[] {
  const ids = [...Array(count).keys()];
  const moved = arrayMove(ids, from, to);
  if (!group.includes(from)) {
    return moved;
  }
  const others = new Set(group.filter((id) => id !== from));
  const rest = moved.filter((id) => !others.has(id));
  const at = rest.indexOf(from);
  return [
    ...rest.slice(0, at),
    ...ids.filter((id) => id === from || others.has(id)),
    ...rest.slice(at + 1),
  ];
}

// Previews a group drag as it'll be dropped, moving each card to the slot `dragOrder` gives it. The
// default strategy only moves the dragged card, so the rest of the group would look like it gets
// shuffled about. Each card takes the slot's position, not its size, as the cards keep theirs.
export function groupSortingStrategy(group: number[]): SortingStrategy {
  return ({ rects, activeIndex, overIndex, index }) => {
    const order = dragOrder(rects.length, group, activeIndex, overIndex);
    const oldRect = rects[index];
    const newRect = rects[order.indexOf(index)];
    if (!oldRect || !newRect) {
      return null;
    }
    return { x: newRect.left - oldRect.left, y: newRect.top - oldRect.top, scaleX: 1, scaleY: 1 };
  };
}

export function groupToStartOrder(count: number, group: number[]): number[] {
  const ids = [...Array(count).keys()];
  return [...ids.filter((id) => group.includes(id)), ...ids.filter((id) => !group.includes(id))];
}

export function groupToEndOrder(count: number, group: number[]): number[] {
  const ids = [...Array(count).keys()];
  return [...ids.filter((id) => !group.includes(id)), ...ids.filter((id) => group.includes(id))];
}

export function withoutGroupOrder(count: number, group: number[]): number[] {
  return [...Array(count).keys()].filter((id) => !group.includes(id));
}

export function applyOrder<T>(list: T[], order: number[]): T[] {
  return order.map((id) => list[id]);
}

// Where the indexes in `ids` ended up after `order`, dropping any that were removed
export function reorderIndexes(ids: Iterable<number>, order: number[]): Set<number> {
  const kept = new Set(ids);
  return new Set(order.flatMap((old, idx) => (kept.has(old) ? [idx] : [])));
}
