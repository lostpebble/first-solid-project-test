import { BookList } from "./BookList";
import { AddBook } from "./AddBook";

interface ICPBookshelf {
  name: string;
}

export function Bookshelf(props: ICPBookshelf) {
  return (
    <div>
      <h1>{props.name}'s Bookshelf</h1>
      <BookList />
      <AddBook />
    </div>
  );
}
