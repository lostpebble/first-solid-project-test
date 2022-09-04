import { For } from "solid-js";
import { bookState, testBookStore } from "./BookState";

export function BookList() {
  const totalBooks = () => bookState().length;

  // console.log(totalBooks());

  return (
    <ul>
      <h2>My books ({testBookStore.state.books().length})</h2>
      <button
        onClick={() => {
          testBookStore.update((s) => {
            s.books.push({
              author: `${Math.random() * 1000} boon`,
              title: "great great",
            });
          });
        }}
      >
        Add random book
      </button>
      <button
        onClick={() => {
          testBookStore.update((s, o) => {
            const index = Math.floor(o.books.length * Math.random());
            s.books[index] = {
              title: `${o.books[index].title} boobs`,
              author: `${o.books[index].author} rock`,
            };
          });
        }}
      >
        Edit random book
      </button>
      <For each={testBookStore.state.books()}>
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
