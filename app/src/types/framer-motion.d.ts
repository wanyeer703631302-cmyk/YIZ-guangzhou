declare module 'framer-motion' {
  import * as React from 'react';

  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    whileDrag?: any;
    whileFocus?: any;
    whileInView?: any;
    viewport?: any;
    drag?: any;
    dragConstraints?: any;
    dragElastic?: any;
    dragMomentum?: any;
    onDragStart?: any;
    onDragEnd?: any;
    onDrag?: any;
    onHoverStart?: any;
    onHoverEnd?: any;
    onTap?: any;
    onTapStart?: any;
    onTapCancel?: any;
    onPan?: any;
    onPanStart?: any;
    onPanEnd?: any;
    layout?: any;
    layoutId?: string;
    layoutDependency?: any;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
    key?: React.Key;
    ref?: React.Ref<any>;
  }

  export const motion: {
    div: React.FC<MotionProps & React.HTMLAttributes<HTMLDivElement>>;
    span: React.FC<MotionProps & React.HTMLAttributes<HTMLSpanElement>>;
    a: React.FC<MotionProps & React.AnchorHTMLAttributes<HTMLAnchorElement>>;
    button: React.FC<MotionProps & React.ButtonHTMLAttributes<HTMLButtonElement>>;
    img: React.FC<MotionProps & React.ImgHTMLAttributes<HTMLImageElement>>;
    svg: React.FC<MotionProps & React.SVGAttributes<SVGSVGElement>>;
    path: React.FC<MotionProps & React.SVGAttributes<SVGPathElement>>;
    circle: React.FC<MotionProps & React.SVGAttributes<SVGCircleElement>>;
    rect: React.FC<MotionProps & React.SVGAttributes<SVGRectElement>>;
    line: React.FC<MotionProps & React.SVGAttributes<SVGLineElement>>;
    g: React.FC<MotionProps & React.SVGAttributes<SVGGElement>>;
    ul: React.FC<MotionProps & React.HTMLAttributes<HTMLUListElement>>;
    li: React.FC<MotionProps & React.HTMLAttributes<HTMLLIElement>>;
    nav: React.FC<MotionProps & React.HTMLAttributes<HTMLElement>>;
    header: React.FC<MotionProps & React.HTMLAttributes<HTMLElement>>;
    footer: React.FC<MotionProps & React.HTMLAttributes<HTMLElement>>;
    main: React.FC<MotionProps & React.HTMLAttributes<HTMLElement>>;
    section: React.FC<MotionProps & React.HTMLAttributes<HTMLElement>>;
    article: React.FC<MotionProps & React.HTMLAttributes<HTMLElement>>;
    aside: React.FC<MotionProps & React.HTMLAttributes<HTMLElement>>;
    h1: React.FC<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h2: React.FC<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h3: React.FC<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h4: React.FC<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h5: React.FC<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    h6: React.FC<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    p: React.FC<MotionProps & React.HTMLAttributes<HTMLParagraphElement>>;
    form: React.FC<MotionProps & React.FormHTMLAttributes<HTMLFormElement>>;
    input: React.FC<MotionProps & React.InputHTMLAttributes<HTMLInputElement>>;
    textarea: React.FC<MotionProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>>;
    select: React.FC<MotionProps & React.SelectHTMLAttributes<HTMLSelectElement>>;
    option: React.FC<MotionProps & React.OptionHTMLAttributes<HTMLOptionElement>>;
    label: React.FC<MotionProps & React.LabelHTMLAttributes<HTMLLabelElement>>;
  };

  export const AnimatePresence: React.FC<{
    children?: React.ReactNode;
    mode?: 'sync' | 'popLayout' | 'wait';
    initial?: boolean;
    onExitComplete?: () => void;
  }>;

  export function useAnimation(): {
    start: (definition: any) => Promise<any>;
    stop: () => void;
    set: (definition: any) => void;
  };

  export function useMotionValue<T>(initial: T): {
    get: () => T;
    set: (value: T) => void;
    onChange: (callback: (value: T) => void) => () => void;
  };

  export function useTransform<T>(
    value: any,
    inputRange: number[],
    outputRange: T[]
  ): any;

  export function useScroll(): {
    scrollX: any;
    scrollY: any;
    scrollXProgress: any;
    scrollYProgress: any;
  };

  export function useSpring(value: any, config?: any): any;

  export function useInView(
    ref: React.RefObject<Element>,
    options?: { once?: boolean; amount?: number }
  ): boolean;
}
