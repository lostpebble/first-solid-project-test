import { createSignal, Show, For, createResource } from "solid-js";
import { BooksApi } from "../api/BooksApi";
import { BookStore } from "./BookState";

export function AddBook() {
  const [input, setInput] = createSignal("");
  const [query, setQuery] = createSignal("");

  const [data] = createResource(query, BooksApi.searchBooks);

  return (
    <>
      <form>
        <div>
          <label for="title">Search books</label>
          <input
            id="title"
            value={input()}
            onInput={(e) => {
              setInput(e.currentTarget.value);
            }}
          />
        </div>
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            setQuery(input());
          }}
        >
          Search
        </button>
      </form>
      <Show when={!data.loading} fallback={<>Searching...</>}>
        <ul>
          <For each={data()}>
            {(book) => (
              <li>
                {book.title} by {book.author}{" "}
                <button
                  aria-label={`Add ${book.title} by ${book.author} to the bookshelf`}
                  onClick={(e) => {
                    e.preventDefault();
                    BookStore.update((s, o) => {
                      s.books = [...o.books, book];
                    });
                  }}
                >
                  Add
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </>
  );
}
