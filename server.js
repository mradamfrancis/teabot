'use strict'

const express = require('express')
const Slapp = require('slapp')
const ConvoStore = require('slapp-convo-beepboop')
const Context = require('slapp-context-beepboop')
const redis = require("redis");
/*const client = redis.createClient({
  url: 'redis://jordanlapointe:42d168c1768236f5665321416a4a2ee3@50.30.35.9:3349/'
});*/

// use `PORT` env var on Beep Boop - default to 3000 locally 
var port = process.env.PORT || 3000

var slapp = Slapp({
  // Beep Boop sets the SLACK_VERIFY_TOKEN env var
  verify_token: process.env.SLACK_VERIFY_TOKEN,
  convo_store: ConvoStore(),
  context: Context()
})

var rateLimitedState = {}
var startTeaState = {}
var teaUsers = {}
var testState = {}
var HELP_TEXT = `
I will respond to the following messages:
\`help\` - to see this message.
\`hi\` - to demonstrate a conversation that tracks state.
\`thanks\` - to demonstrate a simple response.
\`<type-any-other-text>\` - to demonstrate a random emoticon response, some of the time :wink:.
\`attachment\` - to see a Slack attachment message.
`

//*********************************************
// Setup different handlers for messages
//*********************************************

// response to the user typing "help"
/*slapp.message('coffee', ['mention', 'direct_message', 'ambient'], (msg) => {
  msg.say('yuck! get out <@' + msg.body.event.user + '>')
})*/

slapp.message('^(test on)$',['ambient', 'mention'], (msg) => {
  let channel = msg.body.event.channel
  testState[channel] = true
  msg.say('Testing mode on!')
 })
              
slapp.message('^(test off)$',['ambient', 'mention'], (msg) => {
  let channel = msg.body.event.channel
  testState[channel] = false
  msg.say('Testing mode off!')
 })


slapp.message('^(coffee|c|:coffee:)$',['ambient', 'mention'], (msg) => {
  let channel = msg.body.event.channel
  
  if (startTeaState[channel]) {
    msg.say('Already started')
    //startTeaState = false
  } else if (rateLimitedState[channel]) {
      msg.say('We\'ve just finished a round, wait a bit!')
  }
  else {
    teaUsers[channel] = []
    teaUsers[channel].push(msg.body.event.user)
    var user = '<@' + msg.body.event.user + '>'
    msg.say('<!here> time for coffee!!! - who wants in? ' + user + ' is')
    //client.incr('startcount-' + msg.body.event.channel + '-' + msg.body.event.user, function(err, reply) { console.log(reply); });
    //msg.say('<!user> is in')
    //msg.say('<@user> is in 2')
    //msg.say(user + ' is i')
    startTeaState[channel] = true

    setTimeout(() => {
    msg.say('1 minute left - anyone else? :redsiren:')
    var randomHaroun = Math.floor((Math.random() * 10) + 1)
    if (randomHaroun > 5) {
      msg.say('Lucy! Lucy! Lucy!')
    }
      setTimeout(() => {
        startTeaState[channel] = false
        rateLimitedState[channel] = true
        setTimeout(() => {
        rateLimitedState[channel] = false
      }, 120000)

        if (teaUsers[channel].length != 0) {
          var teaMakerId = teaUsers[channel][Math.floor(Math.random()*teaUsers[channel].length)]
          var teaMaker = '<@' + teaMakerId + '>'
          //client.incr('makecount-' + channel + '-' + teaMakerId, function(err, reply) { console.log(reply); });

          // remove duplicates from array
          var uniqueNames = [];
          teaUsers[channel].forEach(function(element) {
            var foundInUnique = false
            uniqueNames.forEach(function(element2) {
              if (element == element2) {
                foundInUnique = true
              }
            })
            if (foundInUnique == false) {
              uniqueNames.push(element)
            }
          })
          if (uniqueNames.length > 1) {
            var listOfDrinkers = ''
            uniqueNames.forEach(function(element) {
              if (element != teaMakerId) {
                listOfDrinkers = listOfDrinkers + '<@' + element + '> '
              }
            })
            if (listOfDrinkers == '') {
              // making it for themselves
              msg.say(teaMaker + ' you\'re making coffee for yourself, you loser :partyparrot:')
            } else {
              msg.say(teaMaker + ' you\'re making coffee for ' + uniqueNames.length + ' people: ' + listOfDrinkers + 'and yourself :partyparrot:')
            }
          } else {
            msg.say(teaMaker + ' you\'re making coffee for yourself, you loser :partyparrot:')
          }
          uniqueNames.forEach(function(name) {
            //client.incr('drinkcount-' + channel + '-' + name, function(err, reply) { console.log(reply); });
            /*client.get('pref-' + channel + '-' + name, function (err, reply) {
                console.log(`nothing in db for: `, name);
                if (reply) {
                  console.log(`Pref in db for: `, name, reply);
                  var user = '<@' + name + '>'
                  msg.say(user + ' - ' + reply.toString().replace('set ', ''));
                }
            });*/
          });
        }
  }, 60000)
  }, 60000)
    //teaUsers
  }
  })


// let channel = msg.body.event.item.channel

slapp.message('^(me|yes|yes!|y|ye|yeah|yes please|yea boi|oh yes|tealight me|ok)$',['ambient', 'mention'], (msg) => {
  let channel = msg.body.event.channel
  if (startTeaState[channel]) {
    teaUsers[channel].push(msg.body.event.user)
    var user = '<@' + msg.body.event.user + '>'
    msg.say('ok - ' + user + ' is in :new_moon_with_face: ')
    //array.push(item.id);
  }
})

slapp.message('^(nah m8|no)$',['ambient', 'mention'], (msg) => {
  msg.say('no worries m8')
})

slapp.message('^(stats)$',['ambient', 'mention'], (msg) => {
    let channel = msg.body.event.channel
    msg.say('Pulling stats :bar_chart:')
    /*client.keys("*count*" + channel + "*", function (err, replies) {
        client.mget(replies, function(err, reply) { console.log(reply) });
  })*/
})



slapp.message('^(set).*',['ambient', 'mention'], (msg) => {
    console.log(`setting prefs for `, msg.body.event.user, ` in channel: `, msg.body.event.channel, ` prefs: `, msg.body.event.text.substring(3, msg.body.event.text.length));
    //client.set('pref-' + msg.body.event.channel + '-' + msg.body.event.user, msg.body.event.text.substring(msg.body.event.text.substring(3, msg.body.event.text.length)));
    console.log(`preference accepted for `, msg.body.event.user);
    msg.say('Awesome! - your preference has been saved!');
})

slapp.message('^(tea|t|:tea:)$',['ambient', 'mention'], (msg) => {
  let channel = msg.body.event.channel
  if (startTeaState[channel]) {
    msg.say('Already started')
    //startTeaState = false
  } else if (rateLimitedState[channel]) {
      msg.say('We\'ve just finished a round, wait a bit!')
  }
  else {
    teaUsers[channel] = []
    //teaUsers[channel].length = 0
    teaUsers[channel].push(msg.body.event.user)
    var user = '<@' + msg.body.event.user + '>'
    msg.say('<!here> time for tea!!! - who wants in? ' + user + ' is')
    //client.incr('startcount-' + msg.body.event.channel + '-' + msg.body.event.user, function(err, reply) { console.log(reply); });

    //msg.say('<!user> is in')
    //msg.say('<@user> is in 2')
    //msg.say(user + ' is i')
    startTeaState[channel] = true

    setTimeout(() => {
    msg.say('1 minute left - anyone else? :redsiren:')
    var randomHaroun = Math.floor((Math.random() * 10) + 1)
    if (randomHaroun > 6) {
      msg.say('Please be Isobel, please be Isobel, please be Isobel.')
    }
      setTimeout(() => {
        startTeaState[channel] = false
        rateLimitedState[channel] = true
        setTimeout(() => {
        rateLimitedState[channel] = false
      }, 120000)

        if (teaUsers[channel].length != 0) {
          var teaMakerId = teaUsers[channel][Math.floor(Math.random()*teaUsers[channel].length)]
          //teaMakerId = 'U1WLZ3BBN'
          var teaMaker = '<@' + teaMakerId + '>'
          //client.incr('makecount-' + channel + '-' + teaMakerId, function(err, reply) { console.log(reply); });

          // remove duplicates from array
          var uniqueNames = [];
          teaUsers[channel].forEach(function(element) {
            var foundInUnique = false
            uniqueNames.forEach(function(element2) {
              if (element == element2) {
                foundInUnique = true
              }
            })
            if (foundInUnique == false) {
              uniqueNames.push(element)
            }
          })
          if (uniqueNames.length > 1) {
            var listOfDrinkers = ''
            uniqueNames.forEach(function(element) {
              if (element != teaMakerId) {
                listOfDrinkers = listOfDrinkers + '<@' + element + '> '
              }
            })
            if (listOfDrinkers == '') {
              // making it for themselves
              msg.say(teaMaker + ' you\'re making tea for yourself, you loser :partyparrot:')
            } else {
              msg.say(teaMaker + ' you\'re making tea for ' + uniqueNames.length + ' people: ' + listOfDrinkers + 'and yourself :partyparrot:')
            }
          } else {
            msg.say(teaMaker + ' you\'re making tea for yourself, you loser :partyparrot:')
          }
          uniqueNames.forEach(function(name) {
            //client.incr('drinkcount-' + channel + '-' + name, function(err, reply) { console.log(reply); });
            /*client.get('pref-' + channel + '-' + name, function (err, reply) {
                console.log(`nothing in db for: `, name);
                if (reply) {
                  console.log(`Pref in db for: `, name, reply);
                  var user = '<@' + name + '>'
                  msg.say(user + ' - ' + reply.toString().replace(/set /i, ''));
                }
            });*/
          });
        }
  }, 60000)
  }, 60000)
    //teaUsers
  }
  })

/*slapp.message('^().*',['ambient', 'mention'], (msg) => {
  if (msg.body.event.user == 'U048RNDMX') {
  //if (msg.body.event.user == 'U04QTKU21') {
    console.log('it was haroun')
    msg.say('Haroun - you are banned from teabot. :no_entry_sign: :hick:')
  } else {
    console.log('it was someone else')
  }
 })*/

/*
// "Conversation" flow that tracks state - kicks off when user says hi, hello or hey
slapp
  .message('^(hi|hello|hey)$', ['direct_mention', 'direct_message'], (msg, text) => {
    msg
      .say(`${text}, how are you?`)
      // sends next event from user to this route, passing along state
      .route('how-are-you', { greeting: text })
  })
  .route('how-are-you', (msg, state) => {
    var text = (msg.body.event && msg.body.event.text) || ''

    // user may not have typed text as their next action, ask again and re-route
    if (!text) {
      return msg
        .say("Whoops, I'm still waiting to hear how you're doing.")
        .say('How are you?')
        .route('how-are-you', state)
    }

    // add their response to state
    state.status = text

    msg
      .say(`Ok then. What's your favorite color?`)
      .route('color', state)
  })
  .route('color', (msg, state) => {
    var text = (msg.body.event && msg.body.event.text) || ''

    // user may not have typed text as their next action, ask again and re-route
    if (!text) {
      return msg
        .say("I'm eagerly awaiting to hear your favorite color.")
        .route('color', state)
    }

    // add their response to state
    state.color = text

    msg
      .say('Thanks for sharing.')
      .say(`Here's what you've told me so far: \`\`\`${JSON.stringify(state)}\`\`\``)
    // At this point, since we don't route anywhere, the "conversation" is over
  })*/
/*
// Can use a regex as well
slapp.message(/^(thanks|thank you)/i, ['mention', 'direct_message'], (msg) => {
  // You can provide a list of responses, and a random one will be chosen
  // You can also include slack emoji in your responses
  msg.say([
    "You're welcome :smile:",
    'You bet',
    ':+1: Of course',
    'Anytime :sun_with_face: :full_moon_with_face:'
  ])
})*/

// demonstrate returning an attachment...
slapp.message('attachment', ['mention', 'direct_message'], (msg) => {
  msg.say({
    text: 'Check out this amazing attachment! :confetti_ball: ',
    attachments: [{
      text: 'Slapp is a robust open source library that sits on top of the Slack APIs',
      title: 'Slapp Library - Open Source',
      image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
      title_link: 'https://beepboophq.com/',
      color: '#7CD197'
    }]
  })
})
/*
// Catch-all for any other responses not handled above
slapp.message('.*', ['direct_mention', 'direct_message'], (msg) => {
  // respond only 40% of the time
  if (Math.random() < 0.4) {
    msg.say([':wave:', ':pray:', ':raised_hands:'])
  }
})*/

// attach Slapp to express server
var server = slapp.attachToExpress(express())

// start http server
server.listen(port, (err) => {
  if (err) {
    return console.error(err)
  }

  console.log(`Listening on port ${port}`)
})
