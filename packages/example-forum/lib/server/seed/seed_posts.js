/* global Vulcan */
import moment from 'moment';
import { createMutator, newMutation, getSetting } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { Promise } from 'meteor/promise';
import { Posts } from '../../modules/posts/index.js';
import { Comments } from '../../modules/comments/index.js';
import Pics from '../../modules/pics/collection.js';

if (getSetting('forum.seedOnStart')) {

  const dummyFlag = {
    fieldName: 'isDummy',
    fieldSchema: {
      type: Boolean,
      optional: true,
      hidden: true,
    },
  };

  Users.addField(dummyFlag);
  Posts.addField(dummyFlag);
  Comments.addField(dummyFlag);
  Pics.addField(dummyFlag);

  Posts.addField({
    fieldName: 'dummySlug',
    fieldSchema: {
      type: String,
      optional: true,
      hidden: true, // never show this
    },
  });

  const toTitleCase = (str) => {
    return str.replace(/\w\S*/g, function(txt) {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  };

  const createPic = async (imageUrl, createdAt, body, username) => {
    const currentUser = await Users.rawCollection().findOne({username: username});
    const pic = {
      createdAt,
      imageUrl: `http://vulcanjs.org/photos/${imageUrl}`,
      body,
      isDummy: true,
      userId: currentUser._id,
    };

    return newMutation({
      collection: Pics,
      document: pic,
      currentUser: currentUser,
      validate: false,
    });
  };

  const createPost = async (slug, postedAt, username, thumbnail) => {
    const currentUser = await Users.rawCollection().findOne({username: username});
    const document = {
      postedAt,
      picId: _.sample(await Pics.rawCollection().find({}).toArray())._id,
      body: Assets.getText('lib/assets/content/' + slug + '.md'),
      title: toTitleCase(slug.replace(/_/g, ' ')),
      dummySlug: slug,
      isDummy: true,
      userId: currentUser._id,
    };

    if (typeof thumbnail !== 'undefined') {
      document.thumbnailUrl = '/packages/example-forum/lib/assets/images/' + thumbnail;
    }

    return createMutator({
      collection: Posts,
      document,
      currentUser,
      validate: false,
    });
  };

  // const createComment = async (slug, username, body, parentBody) => {
  //   const user = await Users.rawCollection().findOne({username: username});
  //   const post = await Posts.rawCollection().findOne({dummySlug: slug});
  //   const comment = {
  //     postId: post._id,
  //     userId: user._id,
  //     body: body,
  //     isDummy: true,
  //     disableNotifications: true,
  //   };
  //   const parentComment = await Comments.rawCollection().findOne({body: parentBody});
  //
  //   if (parentComment) {
  //     comment.parentCommentId = parentComment._id;
  //   }
  //
  //   return newMutation({
  //     collection: Comments,
  //     document: comment,
  //     currentUser: user,
  //     validate: false,
  //   });
  // };

  const createUser = async (username, email) => {
    const document = {
      username,
      email,
      isDummy: true,
    };

    return newMutation({
      collection: Users,
      document,
      validate: false,
    });
  };

  const createDummyUsers = async () => {
    // eslint-disable-next-line no-console
    console.log('// inserting dummy users…');
    return Promise.all([
      createUser('Bruce', 'dummyuser1@telescopeapp.org'),
      createUser('Arnold', 'dummyuser2@telescopeapp.org'),
      createUser('Julia', 'dummyuser3@telescopeapp.org'),
    ]);
  };

  const createDummyPics = async () => {
    // eslint-disable-next-line no-console
    console.log('// creating dummy pics…');
    return Promise.all([
      createPic('cherry_blossoms.jpg', moment().toDate(), `Kyoto's cherry blossoms`, 'Bruce'),
      createPic('koyo.jpg', moment().subtract(10, 'minutes').toDate(), `Red maple leaves during Fall.`, 'Arnold'),
      createPic('cat.jpg', moment().subtract(3, 'hours').toDate(), `This cat was staring at me for some reason…`,
        'Julia'),
      createPic('osaka_tram.jpg', moment().subtract(1, 'days').toDate(), `One of Osaka's remaining tram lines.`,
        'Bruce', 'stackoverflow.png'),
      createPic('matsuri.jpg', moment().subtract(2, 'days').toDate(), `A traditional Japanese dance.`, 'Julia'),
      createPic('flowers.jpg', moment().subtract(6, 'days').toDate(), `Beautiful flowers!`, 'Julia'),
      createPic('kyoto-night.jpg', moment().subtract(12, 'days').toDate(), `Kyoto at night`, 'Arnold'),
      createPic('kaisendon.jpg', moment().subtract(20, 'days').toDate(), `This restaurant had the best kaisendon ever`,
        'Julia'),
      createPic('forest.jpg', moment().subtract(30, 'days').toDate(), `Such a peaceful place`, 'Bruce'),
    ]);
  };

  const createDummyPosts = async () => {
    // eslint-disable-next-line no-console
    console.log('// inserting dummy posts');

    return Promise.all([
      createPost('read_this_first', moment().toDate(), 'Bruce', 'telescope.png'),
      createPost('deploying', moment().subtract(10, 'minutes').toDate(), 'Arnold'),
      createPost('customizing', moment().subtract(3, 'hours').toDate(), 'Julia'),
      createPost('getting_help', moment().subtract(1, 'days').toDate(), 'Bruce', 'stackoverflow.png'),
      createPost('removing_getting_started_posts', moment().subtract(2, 'days').toDate(), 'Julia'),
    ]);
  };

  const createDummyComments = async () => {
    // eslint-disable-next-line no-console
    console.log('// inserting dummy comments…');

    return Promise.all([
      createComment('read_this_first', 'Bruce', 'What an awesome app!'),
      createComment('deploying', 'Arnold', 'Deploy to da choppah!'),
      createComment('deploying', 'Julia', 'Do you really need to say this all the time?', 'Deploy to da choppah!'),
      createComment('customizing', 'Julia', 'This is really cool!'),
      createComment('removing_getting_started_posts', 'Bruce', 'Yippee ki-yay!'),
      createComment('removing_getting_started_posts', 'Arnold', 'I\'ll be back.', 'Yippee ki-yay!'),
    ]);
  };

  Vulcan.removeGettingStartedContent = () => {
    Users.remove({'profile.isDummy': true});
    Posts.remove({isDummy: true});
    Pics.remove({isDummy: true});
    Comments.remove({isDummy: true});
    // eslint-disable-next-line no-console
    console.log('// Getting started content removed from seed_posts');
  };

  // Uses Promise.await to await async functions in a Fiber to make them "Meteor synchronous"
  Meteor.startup(() => {
    // insert dummy content only if createDummyContent hasn't happened and there aren't any posts or users in the db
    if (!Users.find({isDummy: true}).count()) {
      Promise.await(createDummyUsers());
    }
    if (!Pics.find().count()) {
      Promise.await(createDummyPics());
    }
    if (!Posts.find().count()) {
      Promise.await(createDummyPosts());
    }
    // if (!Comments.find().count()) {
    //   Promise.await(createDummyComments());
    // }
  });
}
