const petalColors = ["#ffc8f0", "#cbf2bd", "#afe9ff", "#ffb09e"];
const topGenres = ["Action", "Comedy", "Animation", "Drama"];
const petalPaths = [
  "M0 0 C50 50 50 100 0 100 C-50 100 -50 50 0 0",
  "M-35 0 C-25 25 25 25 35 0 C50 25 25 75 0 100 C-25 75 -50 25 -35 0",
  "M0,0 C50,40 50,70 20,100 L0,85 L-20,100 C-50,70 -50,40 0,0",
  "M0 0 C50 25 50 75 0 100 C-50 75 -50 25 0 0"
];
const rated = ["G", "PG", "PG-13", "R"];

// set flowers position
const perRow = 6;
const pathWidth = 120;

function calculateGridPos(i) {
  return [(i % perRow + 0.5) * pathWidth, (Math.floor(i / perRow) + 0.5) * pathWidth]
}

// import data
d3.json('./movies.json').then(function (data) {
  // transform json object to array data structure
  const movies = _.chain(data)
    .map(d => {
      return {
        title: d.Title,
        released: new Date(d.Released),
        genres: d.Genre.split(', '),
        rating: +d.imdbRating,
        votes: +(d.imdbVotes.replace(/,/g, '')),
        rated: d.Rated,
      }
    }).sortBy(d => -d.released).value();

  const svgHeight = (Math.ceil(movies.length / perRow) + 0.5) * pathWidth

  d3.select('svg')
    .attr('height', svgHeight);
  // console.log(movies);

  /**
   * setting scale to map data to visual representation
   */
  // mapping genre → color
  // color scale
  const colorScale = d3.scaleOrdinal()
    .domain(topGenres)
    .range(petalColors)
    .unknown('#fff2b4'); // if movie has other genre it map to petalColors.Other

  // mapping rated → path (type of flower petal)
  // path scale
  const pathScale = d3.scaleOrdinal()
    .range(petalPaths);
  // when we using this Ordinal Scale everytime when input a new value, it will choose an element whithin the range in order by index, if the next input is a new value, it will map to the next element whithin the range (which hasn't map to other input value yet)
  // d3 will choose the same element within the range when the input is the same
  // depending on this rull, d3 can auto assign the range element to different value input, we don't explicit decide the mapping between the domain and the range, seems more flexible and convenient

  // rating → scale (size of petals)
  // size sacle
  let minMaxRating = d3.extent(movies, d => d.rating);
  const sizeScale = d3.scaleLinear()
    .domain(minMaxRating)
    .range([0.1, 0.65]);

  // votes → numPetals (number of petals)
  const minMaxVotes = d3.extent(movies, d => d.votes);
  const numScale = d3.scaleQuantize()
    .domain(minMaxVotes)
    .range(_.range(5, 10)); // [5, 6, 7, 8, 9, 10]

  flowers = _.map(movies, (d, i) => {
    return {
      title: d.title,
      color: colorScale(d.genres[0]),
      path: pathScale(d.rated),
      scale: sizeScale(d.rating),
      numPetals: numScale(d.votes),
      translate: calculateGridPos(i), // util function that returns [x, y]
    }
  });


  console.log(flowers);

  // d3.select('svg').selectAll('path')
  //   .data(flowers)
  //   .enter()
  //   .append('path')
  //   .attr('d', d => d.path)
  //   .attr('fill', d => d.color)
  //   .attr('transform', (d, i) => `translate(${d.translate}) scale(${d.scale || 1})`)

  // create group elements
  const g = d3.select('svg').selectAll('g')
    .data(flowers).enter().append('g')
    .attr('transform', d => `translate(${d.translate})`)

  // create petal paths
  g.selectAll('path')
    .data(d => {
      return _.times(d.numPetals, i => {
        return Object.assign({}, d, {
          rotate: i * (360 / d.numPetals)
        });
      })
    })
    .enter().append('path')
    .attr('d', d => d.path)
    .attr('transform', d => `rotate(${d.rotate}) scale(${d.scale})`)
    .attr('fill', d => d.color)
    .attr('fill-opacity', 0.75)
    .attr('stroke', d => d.color)

  // create title text
  g.append('text')
    .text(d => _.truncate(d.title, {
      length: 18
    }))
    .style('font-size', '.8em')
    .style('font-style', 'italic')
    .attr('text-anchor', 'middle')

})
