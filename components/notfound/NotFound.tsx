// Página 404 («Uhhhhhh»), RevSlider en el original: capas con las coordenadas medidas en cada ancho
// (posición relativa al centro del viewport, como la rejilla centrada de RevSlider).
import Image from 'next/image';
import Link from 'next/link';
import s from './NotFound.module.css';

export const notFound = {
  eyebrow: 'Parece que estás perdido',
  emoji: '/external/s.w.org_images_core_emoji_17.0.2_svg_1f44b.svg',
  title: 'Uhhhhhh',
  text: 'Esta dirección no existe en la nube de Cloudin',
  button: { label: 'vuelve al inicio', href: '/' },
  ghost: '/wp-content/uploads/2024/07/ghost.png',
  shadow: '/wp-content/uploads/2024/07/shadow.png',
};

export function NotFoundHero() {
  return (
    <div className={s.wrap}>
      <div className={s.module}>
        <div className={s.eyebrow}><Image className={s.emoji} src={notFound.emoji} alt="👋" width={25} height={25} />{' '}{notFound.eyebrow}</div>
        <div className={s.title}>{notFound.title}</div>
        <div className={s.text}>{notFound.text}</div>
        <Link className={s.button} href={notFound.button.href}>{notFound.button.label}</Link>
        <Image className={s.ghost} src={notFound.ghost} alt="" width={371} height={518} priority />
        <Image className={s.shadow} src={notFound.shadow} alt="" width={334} height={102} />
      </div>
    </div>
  );
}
