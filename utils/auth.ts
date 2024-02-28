// @ts-ignore: Web worker types are not cool

self.onmessage = async (e) => {
  console.log(e.data);
  self.close();
};
