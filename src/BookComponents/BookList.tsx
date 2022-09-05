import { createSignal, For } from "solid-js";
import { BookStore } from "./BookState";

export function BookList() {
  return (
    <ul>
      <h2>My books ({BookStore.state.books.length()})</h2>
      <button onClick={() => BookStore.undo()}>UNDO</button>
      <button onClick={() => BookStore.redo()}>REDO</button>
      <br />
      <br />
      <button
        onClick={() => {
          BookStore.update((s) => {
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
          const [editing, setEditing] = createSignal({
            editing: false,
            title: book.title,
            author: book.author,
          });
          // const [editingTitle, setTitle] = createSignal(book.title);
          // const [editingAuthor, setAuthor] = createSignal(book.author);
          return (
            <li>
              <span contentEditable={editing().editing}>{editing().title}</span>{" "}
              <span
                contentEditable={editing().editing}
                onChange={(e) => setEditing({ author: e.target.textContent ?? "" })}
                style={{ "font-style": "italic" }}
              >
                ({editing().author})
              </span>
              <button onClick={() => setEditing((e) => ({ ...e, editing: !e.editing }))}>
                {editing().editing ? "Save" : "Edit"}
              </button>
            </li>
          );
        }}
      </For>
    </ul>
  );
}
