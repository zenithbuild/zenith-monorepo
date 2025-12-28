let greeting = "Hello!"
let founders = "Welcome Judah and Jonathan"

function HelloWorld() {
  setTimeout(() => {
    console.log(greeting);
    setTimeout(() => {
      console.log(founders);
    }, 1000)
  }, 1000)
}

HelloWorld();
