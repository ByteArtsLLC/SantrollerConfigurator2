export function applySellerFavicon(favicon: Uint8Array | null | undefined): () => void {
  if (!favicon?.length) {
    return () => {};
  }

  const existing = document.head.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  const link = existing ?? document.createElement('link');
  const attributes = ['href', 'type', 'sizes'].map(
    (name) => [name, link.getAttribute(name)] as const
  );
  const url = URL.createObjectURL(new Blob([new Uint8Array(favicon)], { type: 'image/png' }));
  link.type = 'image/png';
  link.href = url;
  link.removeAttribute('sizes');
  if (!existing) {
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  return () => {
    if (existing) {
      for (const [name, value] of attributes) {
        if (value === null) {
          link.removeAttribute(name);
        } else {
          link.setAttribute(name, value);
        }
      }
    } else {
      link.remove();
    }
    URL.revokeObjectURL(url);
  };
}
