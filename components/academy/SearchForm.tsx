// Buscador de Academy: va a /academy/buscar/?q=… Con JS navega sin recargar (next/form); sin JS es un GET normal.
// No importa el contenido de las guías, así que se puede usar también desde componentes de cliente.
import Form from 'next/form';
import { SearchIcon } from './Icons';
import a from './Academy.module.css';

type Props = { variant: 'hero' | 'pill'; id: string; defaultValue?: string; autoFocus?: boolean };

export function SearchForm({ variant, id, defaultValue, autoFocus }: Props) {
  const hero = variant === 'hero';
  return (
    <Form action="/academy/buscar/" role="search" className={hero ? a.search : a.pill}>
      <label htmlFor={id} className="sr-only">Buscar en la ayuda</label>
      <span className={a.searchIcon}><SearchIcon size={hero ? 19 : 16} /></span>
      <input
        id={id} name="q" type="search" autoComplete="off" enterKeyHint="search" spellCheck={false}
        defaultValue={defaultValue} autoFocus={autoFocus}
        placeholder={hero ? 'Busca «configurar correo», «DNS», «SSL»…' : 'Buscar en la ayuda…'}
      />
      {hero && <button type="submit" className={a.searchBtn}>buscar</button>}
    </Form>
  );
}
