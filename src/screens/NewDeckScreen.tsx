import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getErrorMessage } from '../api/client';
import { NOTES_MAX_CHARS, NOTES_MIN_CHARS } from '../api/decks';
import {
  BackButton,
  Button,
  ErrorText,
  Input,
  ScreenContainer,
  SegmentedControl,
} from '../components';
import { COLORS } from '../constants/colors';
import { RADIUS, SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';
import { useCreateDeck } from '../hooks';
import { ScreenProps } from '../navigation/types';

type Source = 'text' | 'pdf';

const SOURCE_OPTIONS: { value: Source; label: string }[] = [
  { value: 'text', label: 'Paste text' },
  { value: 'pdf', label: 'Upload PDF' },
];

export default function NewDeckScreen({ navigation }: ScreenProps<'NewDeck'>) {
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<Source>('text');
  const [text, setText] = useState('');
  const [pdf, setPdf] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const createDeck = useCreateDeck({
    onSuccess: (deck) => navigation.replace('Deck', { deckId: deck.id }),
  });

  const notesLength = text.trim().length;
  const hasContent = source === 'text' ? notesLength >= NOTES_MIN_CHARS : pdf !== null;

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      setPdf(result.assets[0]);
    }
  };

  const handleGenerate = () => {
    const deckTitle = title.trim() || undefined;
    if (source === 'text') {
      createDeck.mutate({ title: deckTitle, text });
    } else if (pdf) {
      createDeck.mutate({
        title: deckTitle,
        file: { uri: pdf.uri, name: pdf.name, mimeType: pdf.mimeType },
      });
    }
  };

  return (
    <ScreenContainer
      footer={
        <Button
          label="Generate flashcards"
          onPress={handleGenerate}
          loading={createDeck.isPending}
          disabled={!hasContent}
        />
      }
    >
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>New deck</Text>
      </View>

      <Input
        label="Deck title"
        placeholder="Optional, e.g. Organic Chemistry"
        value={title}
        onChangeText={setTitle}
      />

      <View style={styles.source}>
        <SegmentedControl options={SOURCE_OPTIONS} value={source} onChange={setSource} />
      </View>

      {source === 'text' ? (
        <TextInput
          style={styles.textArea}
          placeholder="Paste your notes here…"
          placeholderTextColor={COLORS.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={NOTES_MAX_CHARS}
          textAlignVertical="top"
          editable={!createDeck.isPending}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={pickPdf}
          style={({ pressed }) => [styles.dropZone, pressed && styles.pressed]}
        >
          <Ionicons
            name={pdf ? 'document-text' : 'cloud-upload-outline'}
            size={28}
            color={COLORS.accent}
          />
          <Text style={styles.dropZoneTitle} numberOfLines={1}>
            {pdf ? pdf.name : 'Choose a PDF'}
          </Text>
          <Text style={styles.dropZoneHint}>
            {pdf ? 'Tap to choose a different file' : 'Lecture notes, slides or a textbook chapter'}
          </Text>
        </Pressable>
      )}

      {source === 'text' && notesLength > 0 && notesLength < NOTES_MIN_CHARS ? (
        <Text style={styles.counter}>
          {NOTES_MIN_CHARS - notesLength} more characters needed
        </Text>
      ) : null}

      <View style={styles.aiHint}>
        <Ionicons name="sparkles" size={14} color={COLORS.accent} />
        <Text style={styles.aiHintText}>
          {createDeck.isPending
            ? 'Generating your flashcards. This can take up to a minute…'
            : 'AI will create about 20 flashcards and a short summary.'}
        </Text>
      </View>

      {createDeck.isError ? (
        <View style={styles.error}>
          <ErrorText message={getErrorMessage(createDeck.error)} />
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: 24,
  },
  headerTitle: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
  },
  source: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  textArea: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    minHeight: 200,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  dropZone: {
    minHeight: 200,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  pressed: { opacity: 0.7 },
  dropZoneTitle: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  dropZoneHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  counter: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  error: {
    marginTop: SPACING.md,
  },
  aiHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  aiHintText: {
    ...TYPOGRAPHY.caption,
    flex: 1,
    color: COLORS.textMuted,
  },
});
