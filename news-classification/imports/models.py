from transformers import RobertaModel, RobertaTokenizer
import torch
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score
import numpy as np

PKL_PATH = "weights/clf.pkl"
BERT_EMB_PATH = "datasets/bert_embeddings.npy"
LABELS_PATH = "datasets/labels.npy"
DF_PATH = "datasets/df_news_labeled.csv"
TBL_PATH = "datasets/tbl_merged.json"
LBLD_JSON_PATH = "datasets/labeled_merged.json"

tokenizer = RobertaTokenizer.from_pretrained("roberta-base")
BERTmodel = RobertaModel.from_pretrained("roberta-base", add_pooling_layer=False)
clf = LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

def get_embedding_single(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad(): # freeze RoBERTa
        outputs = BERTmodel(**inputs)
    return outputs.last_hidden_state[:, 0, :].squeeze().numpy()  # CLS token, as a single "line" converted to numpy suitable

def get_embs_all(art:dict)->np.array:
    texts = [a for a in art.values()]
    np.array([get_embedding_single(t) for t in texts])