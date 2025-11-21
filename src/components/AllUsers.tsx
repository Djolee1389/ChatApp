// import { useEffect, useState } from "react";
// import { collection, onSnapshot } from "firebase/firestore";
// import { auth, db } from "../firebase";

// interface User {
//   uid: string;
//   username: string;
//   email: string;
//   photoURL?: string;
// }

// export default function AllUsers() {
//   const [users, setUsers] = useState<User[]>([]);

//   useEffect(() => {
//     if (!auth.currentUser) return;

//     const ref = collection(db, "users");
//     const unsubscribe = onSnapshot(ref, (snapshot) => {
//       const data: User[] = snapshot.docs.map((doc) => {
//         const d = doc.data();
//         return {
//           uid: doc.id,
//           username: d.username || "",
//           email: d.email || "",
//           photoURL: d.photoURL || "",
//         };
//       });

//       setUsers(data.filter((u) => u.uid !== auth.currentUser?.uid));
//     });

//     return () => unsubscribe();
//   }, []);

//   return <div>a</div>;
// }
