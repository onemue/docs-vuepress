// const P1 = new Promise((resolve, reject) => {
//   setTimeout(e => {
//     resolve({code: 200, msg: 'Promise-200'});
//   }, 200);
// });
// const P2 = new Promise((resolve, reject) => {
//   setTimeout(e => {
//     resolve({code: 200, msg: 'Promise-2000'});
//   }, 2000);
// });

// const P3 = new Promise((resolve, reject) => {
//   setTimeout(e => {
//     reject({code: 200, msg: 'Promise-1500'});
//   }, 1500);
// });

// Promise.allSettled([P1, P2, P3, async e=>{return {code: 200, msg: 'async-1500'}}]).then(values => {
//   console.log(values);
// }).catch(error => {
//   console.log(error);
// })

async function asyncFun() {
  setTimeout(() => {
    console.log('await setTimeouot');
  }, 200);
  try {
    const awaitPromise = await new Promise((resolve, reject)=>{
      setTimeout(e => { resolve('await Promise Resolve') }, 200);
      setTimeout(e => { reject('await Promise Reject') }, 199);
    });
    console.log(awaitPromise);
  } catch (error) {
    console.log(error);
  }

  return 'async Funciton';
} 

asyncFun().then(e => { console.log(e) });

let myMap = new Map([["key1", "value1"], ["key2", "value2"]]);
console.log(myMap.get('key1'));

funAsync = async function asyncFun() {

  let a = await new Promise((reject, resolve)=>{
    setTimeout(() => {
      reject('await setTimeouot');
    }, 200)
  });
  console.log(a)
  // return 'async Funciton';
} 

funAsync()

async function getPromise(){
  return Promise.resolve('something');
}
let getSomething = async function(){
  let a = await getPromise();
  return a;
}
console.log(getSomething())