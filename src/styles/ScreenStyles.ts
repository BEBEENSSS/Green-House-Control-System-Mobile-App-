import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressBar: {
    marginTop: 30, // Adds space from the top
    width: 150,
    height: 150,
    alignSelf: 'center', // Centers horizontally
  },
  containerOption: {
    marginTop: 60,
    height: '100%',
    paddingVertical: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
    borderRadius: 10,
  },
  toggleContainer: {
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  textOption: {
    fontSize: 17,
  },
  texttemp: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
  },
  textwater: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#616161',
  }
});