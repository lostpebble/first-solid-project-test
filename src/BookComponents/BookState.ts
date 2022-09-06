import { createImmerStore } from "../utils/createImmerStore";

type Book = {
  title?: string;
  author: string;
};

export const initialBooks: Book[] = [
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

export interface IBookStore {
  books: Book[];
  testObject: {
    hi: boolean;
    something?: string;
  };
}

export const BookStore = createImmerStore<IBookStore>({
  books: initialBooks,
  testObject: { hi: true, something: "else" },
});

BookStore.update((s) => {
  s.books.push({
    title: "Test",
    author: "Hi bean",
  });
});
