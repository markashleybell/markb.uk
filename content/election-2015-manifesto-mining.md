Title: Election 2015: Manifesto Mining
Abstract: Creating word frequency illustrations from the 2015 election manifestos.
Thumbnail: manifesto-mining-liberal-democrat-sml.png
Published: 2015-03-26 16:39
Updated: 2015-03-26 16:39

With the 2015 General Election just over a week away, I thought I'd read through the manifestos of the various parties, to try and help me decide who should get my vote.

After an embarrassingly short period of time, I got bored and decided to make them into pretty pictures instead. Click on any image below to see the full size version.

## Liberal Democrats

[![Liberal Democrats](~/img/post/manifesto-mining-liberal-democrat-sml.png "Liberal Democrats")](~/img/post/manifesto-mining-liberal-democrat-lge.png)

Most of you will have seen word clouds before, but in case you're one of those who haven't: the bigger the word, the more times it appears in that manifesto.

As this is a developer blog, I'll mention a few technical bits and pieces: I used [PDFMiner](https://github.com/euske/pdfminer) to extract the raw text from the manifesto PDF files, then knocked together a [Python script](https://github.com/markashleybell/manifesto-miner) and a list of stop words to clean up and process the text data. The word clouds themselves are rendered using Tim Chien's [wordcloud2.js](https://github.com/timdream/wordcloud2.js).

## Labour

[![Labour](~/img/post/manifesto-mining-labour-sml.png "Labour")](~/img/post/manifesto-mining-labour-lge.png)

## Conservatives

[![Conservatives](~/img/post/manifesto-mining-green-sml.png "Conservatives")](~/img/post/manifesto-mining-green-lge.png)

## Plaid Cymru

[![Plaid Cymru](~/img/post/manifesto-mining-plaid-cymru-sml.png "Plaid Cymru")](~/img/post/manifesto-mining-plaid-cymru-lge.png)

## Green Party

[![Green Party](~/img/post/manifesto-mining-green-sml.png "Green Party")](~/img/post/manifesto-mining-green-lge.png)

## SNP

[![SNP](~/img/post/manifesto-mining-snp-sml.png "SNP")](~/img/post/manifesto-mining-snp-lge.png)

## UKIP

[![UKIP](~/img/post/manifesto-mining-ukip-sml.png "UKIP")](~/img/post/manifesto-mining-ukip-lge.png)

The order in which the illustrations appear *does not* indicate my voting preference, or my support for any one party over the others*. I can assure you that these illustrations have not been artificially manipulated, but if you'd like to check that, feel free to [download my code](https://github.com/markashleybell/manifesto-miner) along with the manifestos and give it a try yourself.

**These results are not in *any way* scientific**, or arguably even very useful. Nor do they accurately reflect the parties' policies (although I think we can see pretty clearly where Plaid Cymru are going with theirs). They are, however, quite interesting.

<small>*UKIP are a bunch of idiots, though.</small>
