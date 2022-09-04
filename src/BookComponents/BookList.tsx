import { createSignal, For } from "solid-js";
import { BookStore } from "./BookState";
import { BooksApi } from "../api/BooksApi";

export function BookList() {
  return (
    <ul>
      <h2>My books ({BookStore.state.books.length()})</h2>
      <button
        onClick={() => {
          BookStore.update((s) => {
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
          BookStore.update((s, o) => {
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
      <For each={BookStore.state.books()}>
        {(book) => {
          const [editing, setEditing] = createSignal(false);
          return (
            <li>
              {book.title} <span style={{ "font-style": "italic" }}>({book.author})</span>
              <button onClick={() => setEditing((e) => !e)}>{editing() ? "Save" : "Edit"}</button>
            </li>
          );
        }}
      </For>
    </ul>
  );
}
