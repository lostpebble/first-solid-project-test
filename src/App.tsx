import type { Component } from "solid-js";
import styles from "./App.module.css";
import { Bookshelf } from "./BookComponents/Bookshelf";

const App: Component = () => {
  return (
    <>
      <header class={styles.header}>Life's Little Bookery Bastard Fuuuuuuuu</header>
      <div class={styles.content}>
        <Bookshelf name={"Knobby"} />
      </div>
    </>
  );
};

export default App;
