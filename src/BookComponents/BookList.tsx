import { For } from "solid-js";
import { bookState } from "./BookState";

export function BookList() {
  const totalBooks = () => bookState().length;

  return (
    <ul>
      <h2>My books ({totalBooks()})</h2>
      <For each={bookState()}>
        {(book) => {
          return (
            <li>
              {book.title} <span style={{ "font-style": "italic" }}>({book.author})</span>
            </li>
          );
        }}
      </For>
    </ul>
  );
}
