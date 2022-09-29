const axios = require('axios');
const cheerio = require('cheerio');
const date = require('date-and-time');
const fs = require('fs');

// outputs promise of cheerio parsed DOM object
const parseHtml = (url) => {
  return axios.get(url).then(({ data }) => cheerio.load(data));
};

// input url string
// outputs array of objects
const getBlogPage = (url, tag, blogs = []) => {
  return parseHtml(url).then($ => { // $ variable is to align syntax with jquery (which cheerio package replicates)
    $('div.article').each((i, article) => {
      blogs.push({
        title: $(article).find('h3').text().replaceAll(',', ''),
        tag: tag,
        url: $(article).find('a.article-title').prop('href'),
        author: $(article).find('div.article-meta').find('a').text(),
        date: date.transform($(article).find('div.date').text(), 'MMMM D, YYYY', 'M/D/YYYY'),
      })
    })
    return blogs;
  })
};

// accepts string input for tag, looks for max 10 pages
const getBlogs = (tag, arr = []) => {
  for (let i=1; i < 11; i++) {
    arr.push(getBlogPage(`https://blog.pythian.com/tag/${tag}/page/${i}`, tag)
      .catch(() => null ));
  }
  return Promise.allSettled(arr).then(res => {
    let result = [];
    res.forEach(({value}) => value ? result.push(value) : null)
    return result.flat();
  });
}

// accepts any array of objects
const createCSV = (data) => {
  let csvContent = [];
  csvContent.push(Object.keys(data[0]).join()); // headers

  while (data.length) {
    const record = data.pop();
    csvContent.push(Object.values(record).join());
  }

  const csvString = csvContent.join('\n');
  fs.writeFile(__dirname + '/data.csv', csvString, err => {
    if (err) {
      console.error(err);
    }
    console.log('file written');
  });
};

Promise.all([getBlogs('cassandra'),getBlogs('apache-cassandra'),getBlogs('mongodb'),getBlogs('mysql')])
  .then(blogs => createCSV(blogs.flat()));
