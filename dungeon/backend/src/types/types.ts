export interface Frined {
    username: string,
    uid: string,
    profImg: string
}

export interface User {
  uid: string;
  username: string;
  passwordHash: string;
  classe: string;
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
