import { forwardRef } from 'react';

type ImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string | { src: string };
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  unoptimized?: boolean;
};

const Image = forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt = '',
      fill,
      priority: _priority,
      quality: _quality,
      placeholder: _placeholder,
      blurDataURL: _blurDataURL,
      unoptimized: _unoptimized,
      style,
      ...props
    },
    ref
  ) => {
    const resolvedSrc = typeof src === 'string' ? src : src.src;

    return (
      <img
        ref={ref}
        src={resolvedSrc}
        alt={alt}
        style={{
          ...(fill
            ? {
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
              }
            : null),
          ...style,
        }}
        {...props}
      />
    );
  }
);

Image.displayName = 'LocalImage';

export type { ImageProps };
export type StaticImport = string | { src: string };
export default Image;
