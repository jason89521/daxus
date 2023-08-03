import type { Post, PostLayout } from '@/type';

const arr = Array(1000).fill(0);

function getLayout(): PostLayout {
  return Math.random() > 0.5 ? 'classic' : 'image';
}

function getForumId() {
  const factor = Math.random();
  if (factor > 0.7) return 'forumId_1';
  if (factor > 0.3) return 'forumId_2';
  return 'forumId_3';
}

export const posts: Post[] = arr.map((_, index) => {
  return {
    id: `postId_${index}`,
    title: `Post ${index}`,
    layout: getLayout(),
    forumId: getForumId(),
    likeCount: 0,
    excerpt:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pretium quam eu quam euismod posuere. Ut dictum vitae erat ac tristique. Curabitur congue, turpis sed scelerisque dictum, nibh nisl condimentum tellus, eu interdum dui sapien in nulla. Sed quis nunc at quam consectetur porta. Duis imperdiet leo et tortor maximus tristique.',
    content: `
    # Post Title ${index}

    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pretium quam eu quam euismod posuere. Ut dictum vitae erat ac tristique. Curabitur congue, turpis sed scelerisque dictum, nibh nisl condimentum tellus, eu interdum dui sapien in nulla. Sed quis nunc at quam consectetur porta. Duis imperdiet leo et tortor maximus tristique. Suspendisse pretium libero quis risus commodo hendrerit. Praesent ultrices suscipit odio, ac placerat nisi ultricies non. Aliquam enim lacus, posuere ut ornare in, tempus vitae felis. Nunc luctus ex ut nisi ornare convallis. Vestibulum imperdiet mauris est, ac lacinia sapien sodales ac. Maecenas felis diam, mollis at urna id, interdum suscipit augue. Quisque iaculis erat sapien, et dapibus tortor consectetur quis. Nullam velit nunc, congue eget luctus a, feugiat nec diam. Cras purus nibh, aliquet luctus tellus eu, sagittis malesuada mi. Pellentesque fringilla, risus et luctus scelerisque, ligula risus elementum lacus, sit amet tincidunt odio tellus ac tellus. Integer porttitor nisi quis lorem ultrices, sit amet fermentum purus tincidunt.

    ## Section 1

    Vivamus in fringilla libero. Aliquam volutpat arcu a lobortis porttitor. Proin mi nibh, hendrerit id porttitor ut, dictum vehicula nunc. Cras ut blandit sem. Nulla facilisi. Ut vitae diam ullamcorper, malesuada elit vitae, tincidunt tellus. Maecenas et orci eget ante efficitur dictum. Aliquam erat volutpat. Fusce consequat, leo at iaculis hendrerit, risus nisl placerat lectus, sit amet ullamcorper purus mi sed ante. Praesent tristique neque sed lectus interdum efficitur. Curabitur tincidunt eros at magna congue, vitae egestas risus blandit.

    ## Section 2

    Quisque vitae mi et velit suscipit tempus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur id erat tristique, maximus urna id, bibendum risus. Donec a purus consectetur, tempor neque vel, consequat nibh. Aliquam erat volutpat. Vivamus vehicula quis ligula sit amet feugiat. Pellentesque pretium rutrum ultricies. Praesent eget gravida enim, ut ullamcorper mauris.

    ### Section 2-1

    Nulla blandit consectetur rutrum. Fusce ornare ipsum vel dolor ultrices convallis. Suspendisse eget euismod turpis. Nam scelerisque ante vitae elit volutpat, a pulvinar risus blandit. Sed sed pharetra nibh. Aliquam eget facilisis lectus, sodales lobortis velit. Nunc vitae quam sed erat luctus bibendum vel sit amet ex. Nulla id purus tristique, dignissim mi nec, hendrerit erat. Maecenas consectetur placerat molestie. Nam dignissim tortor at nibh dapibus vestibulum. Vivamus tincidunt lectus ac egestas tristique.

    ### Section 2-2

    Proin vitae neque id enim tincidunt lacinia. Pellentesque eleifend vel enim vel sodales. Nullam consequat imperdiet luctus. Vestibulum sodales et quam at pulvinar. Phasellus posuere lectus lorem, eu molestie est sodales et. Quisque sit amet pharetra elit. Etiam non tincidunt nisl. Sed sed risus aliquet, sodales nibh eget, ornare neque. Duis eu pretium leo, sed ornare lorem. Donec dolor magna, rhoncus semper dui non, accumsan finibus diam. Phasellus pretium est nec dui pharetra, vel accumsan massa vehicula. Cras egestas gravida accumsan. Mauris eu magna et justo elementum ullamcorper vitae sit amet sapien. Mauris rutrum viverra odio, eget porta lacus ultricies quis. Vivamus mattis iaculis dapibus. Donec lacus tellus, lobortis vitae volutpat non, congue sit amet augue.
    `,
  };
});
