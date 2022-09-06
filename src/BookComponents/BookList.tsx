import { For } from "solid-js";
import { IBookStore, initialBooks } from "./BookState";
import { createImmerStore } from "../utils/createImmerStore";

export function BookList() {
  const { state: { books }, update, undo, redo } = createImmerStore<IBookStore>({
    books: initialBooks,
    testObject: { hi: true, something: "else" },
  });

  return (
    <ul>
      <h2>My books ({books.length()})</h2>
      <button onClick={() => undo()}>UNDO</button>
      <button onClick={() => redo()}>REDO</button>
      <br />
      <br />
      <div style={{ gap: `${books.length() / 10}em`, display: "flex" }}>
        <button
          onClick={() => {
            update((s) => {
              s.books = [];
            });
          }}
        >
          Remove all books
        </button>
        <button
          onClick={() => {
            update((s, o) => {
              for (const book of s.books) {
                delete book.title;
              }
            });
          }}
        >
          Remove all titles
        </button>
        <button
          onClick={() => {
            update((s) => {
              s.books.push({
                author: `${Math.random() * 1000} boon`,
                title: "great great great",
              });
            });
          }}
        >
          Add random book
        </button>
        <button
          onClick={() => {
            update((s, o) => {
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
      </div>
      <For each={books()}>
        {(book) => {
          return (
            <li>
              <span>{book.title}</span>{" "}
              <span style={{ "font-style": "italic" }}>({book.author})</span>
            </li>
          );
        }}
      </For>
    </ul>
  );
}
