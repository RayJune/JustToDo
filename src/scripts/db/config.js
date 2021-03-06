export default {
  name: 'JustToDo',
  version: '23',
  storeConfig: [
    {
      storeName: 'list',
      key: 'id',
      initialData: [
        {
          id: 0, event: 'JustDemo', finished: true, date: 0,
        },
      ],
    },
    {
      storeName: 'aphorism',
      key: 'id',
      initialData: [
        {
          id: 1,
          content: "You're better than that",
        },
        {
          id: 2,
          content: 'Yesterday You Said Tomorrow',
        },
        {
          id: 3,
          content: 'Why are we here?',
        },
        {
          id: 4,
          content: 'All in, or nothing',
        },
        {
          id: 5,
          content: 'You Never Try, You Never Know',
        },
        {
          id: 6,
          content: 'The unexamined life is not worth living. -- Socrates',
        },
        {
          id: 7,
          content: 'There is only one thing we say to lazy: NOT TODAY',
        },
      ],
    },
  ],
};
