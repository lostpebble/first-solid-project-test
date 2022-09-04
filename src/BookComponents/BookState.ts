import { createImmerStore } from "../utils/createImmerStore";

type Book = {
  title: string;
  author: string;
};

const initialBooks: Book[] = [
  { title: "Code Complete", author: "Steve McConnell" },
  { title: "The Hobbit", author: "J.R.R. Tolkien" },
  {
    title: "Grand Designs",
    author: "Some tosser pommie bastard",
  },
];
/*
const [books, setBooks] = createSignal(initialBooks);

export const bookState = books;
export const setBookState = setBooks;*/

export const BookStore = createImmerStore({ books: initialBooks });

BookStore.update((s) => {
  s.books.push({
    title: "Test",
    author: "Hi bean",
  });
});
