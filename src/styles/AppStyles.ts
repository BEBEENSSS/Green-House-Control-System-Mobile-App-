// AppStyles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  iconContainer: {
    padding: 8,
  },
  mainContainer: {
    flex: 1,
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  opacityBox: {
    width: '48%', // Match the box width
  },
  box: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
    borderRadius: 10,
  },
  boxContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxText: {
    color: '#4A4A4A',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    bottom: 0,
    left: 0,
    right: 0,
    marginTop: -20,
  },
  gap: {
    width: 20,
  },
  rowGap: {
    height: 20,
  },
  title: {
    fontSize: 20,
    color: '#0a9000',
    fontWeight: 'bold',
  },
});