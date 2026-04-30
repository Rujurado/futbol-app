import { collection, addDoc, getDocs, orderBy, query, serverTimestamp, deleteDoc, doc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './config'

export async function saveMatch(matchData) {
  const { id: _id, ...data } = matchData
  await addDoc(collection(db, 'matches'), { ...data, createdAt: serverTimestamp() })
}

export async function getMatches() {
  const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getPlayers() {
  const q = query(collection(db, 'players'), orderBy('name', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function savePlayer(player) {
  await setDoc(doc(db, 'players', player.id), {
    name: player.name,
    position: player.position || '',
    number: player.number || '',
    photo: player.photo || null,
    createdAt: serverTimestamp(),
  })
}

export async function removePlayerFromDB(id) {
  await deleteDoc(doc(db, 'players', id))
}

export async function uploadPlayerPhoto(file, playerId) {
  if (!file.type.startsWith('image/')) throw new Error('Solo se permiten imagenes')
  if (file.size > 10 * 1024 * 1024) throw new Error('La imagen no puede superar 10MB')
  const ext = file.name.split('.').pop() || 'jpg'
  const storageRef = ref(storage, `players/${playerId}-${Date.now()}.${ext}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}