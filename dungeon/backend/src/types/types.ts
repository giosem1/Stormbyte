export interface Frined {
    username: string,
    uid: string,
    profImg: string
}

export interface User {
  uid: string;
  username: string;
  password: string;
  class: string;
  profileImage?: string;
  friends: Frined[];
  inventory: any[];
  dungeons: {
    id: string;
    code: string;
    nameDungeon: string;
    blobUrl?: string;
  }[];
}
