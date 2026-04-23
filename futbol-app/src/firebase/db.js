import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './config'

export async function saveMatch(matchData) {
  const { id: _id, ...data } = matchData
  await addDoc(collection(db, 'matches'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function getMatches() {
  const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function uploadPlayerPhoto(file, playerId) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  if (!allowed.includes(file.type)) throw new Error('Solo se permiten imágenes JPG, PNG o WebP')
  if (file.size > 5 * 1024 * 1024) throw new Error('La imagen no puede superar 5MB')

  const ext = file.name.split('.').pop()
  const storageRef = ref(storage, `players/${playerId}-${Date.now()}.${ext}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
