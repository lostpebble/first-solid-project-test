export function HelloWorld() {
  const name = "Solid";
  const style = {
    "background-color": "#2c4f7c",
    color: "#FFF",
    padding: "0.5em",
    "border-radius": "0.5em",
  };

  return <div style={style}>Hello {name}</div>;
}
