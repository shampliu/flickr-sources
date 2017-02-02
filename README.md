# Sourcr
A tool to aggregate and display all the referrers of your Flickr photos.

<!-- add screenshots / gifs -->

## About
For Flickr Stats currently, there is no way to see an aggregated view of all the sources that have referred your work. You can only see all the referrers for a given day. I built this app to compile all that into one file so you can see which websites have featured your photos and how many times that feature has brought people to your Flickr page.

## Setup
This app requires [PhantomJS](http://phantomjs.org/) and [npm](https://www.npmjs.com/).

1. Clone or download the ZIP for this repository
2. Inside the directory, run `npm install`  

## Usage
Run `casperjs index.js` or `phantomjs index.js` to start the app.

You will be prompted for some information
1. **Email**: the e-mail you use to sign in to Flickr
2. **Password**
3. **User ID**: the identifier for your Flickr URL, *e.g.* [flickr.com/photos/**spaceabstract**](https://flickr.com/photos/spaceabstract/)

## Disclaimers
* This only works for Flickr PRO subscribers since viewing statistics is a premium feature.
