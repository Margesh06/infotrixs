const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const request = require('request');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-Margesh:margesh@cluster0.dgnbguu.mongodb.net/task1db");

const authorschema = {
    Name: String,
    Quote: String
};

const dq = mongoose.model("qoute", authorschema);


app.get('/', (req, res) => {

    request('https://zenquotes.io/api/quotes', (error, response, body) => {
      if (error) {
        console.error('Error fetching quotes:', error.message);
        res.status(500).send('Internal Server Error');
        return;
      }
  
      try {
        const quotes = JSON.parse(body);

        const quoteTexts = quotes.map(quote => quote.q);
        
        const randomQuotes = [];
        for (let i = 0; i < 4; i++) {
          const randomIndex = Math.floor(Math.random() * quotes.length);
          const randomQuote = quotes[randomIndex];
          randomQuotes.push({ quote: randomQuote.q, author: randomQuote.a });
        }
      
        res.render('display', { quote: randomQuotes });
      } catch (parseError) {
        console.error('Error parsing quotes:', parseError.message);
        res.status(500).send('Internal Server Error');
      }
    });
  });

  app.get("/details", async function (req, res) {
    try {
        // Fetch all quotes from the database
        const allQuotes = await dq.find();
        
        // Render a new view to display all quotes
        res.render("details", { quotes: allQuotes });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// Assuming quotesData is a global variable to store quotes data
let quotesData = [];

app.post("/search", async function (req, res) {
    const searchName = req.body.searchText.trim().toLowerCase();

    // Fetch quotes data only if it's not already fetched
    if (quotesData.length === 0) {
        const apiUrl = 'https://zenquotes.io/api/quotes';
        request(apiUrl, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                quotesData = JSON.parse(body);
                console.log(quotesData);
                searchQuotes();
            } else {
                res.render("find", { searchResult: 'Error fetching quotes from the API.' });
            }
        });
    } else {
        searchQuotes();
    }

    function searchQuotes() {
        const matchingQuotes = quotesData.filter(quote => quote.a.trim().toLowerCase() === searchName);

        if (matchingQuotes.length > 0) {
            const randomQuote = matchingQuotes[Math.floor(Math.random() * matchingQuotes.length)].q;

            const author = new dq({
                Name: searchName,
                Quote: randomQuote
            });
            author.save();

            res.render("find", { searchResult: randomQuote});
        } else {
            res.render("find", { searchResult: 'No quotes found for the given author.' });
        }
    }
});


  
  app.listen(3000, () => {
    console.log('Server started on port 3000');
  });