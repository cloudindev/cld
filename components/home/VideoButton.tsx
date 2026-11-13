'use client';
// Botón «Button» (texto literal del original) de /hosting-y-dominios-cloud-empresas/: abre un modal
// (lity en el original) con el vídeo /cloudin-hosting.mp4 en autoplay. Esc o ✕ lo cierran.
import { useRef } from 'react';
import s from './Family.module.css';

export function VideoButton() {
  const dlg = useRef<HTMLDialogElement>(null);
  const close = () => { const v = dlg.current?.querySelector('video'); v?.pause(); dlg.current?.close(); };
  return (
    <div className={s.btnItem}>
      <a className={s.videoBtn} href="#modal-5061" onClick={e => { e.preventDefault(); dlg.current?.showModal(); void dlg.current?.querySelector('video')?.play(); }}>
        <span>Button</span>
      </a>
      <dialog ref={dlg} id="modal-5061" className={s.dialog} aria-label="Dialog Window (Press escape to close)" onClose={close} onClick={e => { if (e.target === dlg.current) close(); }}>
        <button type="button" className={s.dialogClose} aria-label="Close (Press escape to close)" onClick={close}>
          <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
        </button>
        <video className={s.video} src="/cloudin-hosting.mp4" controls controlsList="nodownload" preload="none" />
      </dialog>
    </div>
  );
}
