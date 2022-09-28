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
const getBlogDetails = (url, blogs = []) => {
  return parseHtml(url).then($ => { // $ variable is to align syntax with jquery (which cheerio package replicates)
    $('div.article').each((i, article) => {
      blogs.push({
        title: $(article).find('h3').text().replaceAll(',', ''),
        url: $(article).find('a.article-title').prop('href'),
        author: $(article).find('div.article-meta').find('a').text(),
        date: date.transform($(article).find('div.date').text(), 'MMMM D, YYYY', 'M/D/YYYY'),
      })
    })
    return blogs;
  })
};

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

getBlogDetails('https://blog.pythian.com/tag/mongodb/')
  .then(blogs => createCSV(blogs));
