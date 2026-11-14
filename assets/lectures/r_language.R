# Komentáře...

# Názvy
# _3
# 3a
# snake_case
ahoj_ja_se_jmenuju_michal <- TRUE

# Jednoduché proměnné
jmeno <- "Michal" # string
vek <- 26 # integer
vyska <- 185.26 # double, float
narozeni <- as.Date("2020-01-01") # YYYY-MM-DD
je_muz <- TRUE # FALSE

# Kompaktnější formáty
## Vektor - stejný datový typ
jmena <- c("michal", "david", "petr")
mereni <- c(4, 5, 5.2, 9, 12)
hodnoty <- c(1, 2, 3, "d")

## list - různé datové typy
data <- list(
  jmena = c("a", "b", "c"),
  je_ctvrtek = TRUE,
  data2 = list()
)

## tabulky - data pro práci
moje_data <- data.frame(
  respondent = c(1, 2, 3),
  odpoved = c(TRUE, TRUE, FALSE)
)

# Jak s tím pracovat
## Vektory
jmena
jmena[2]
jmena[3]
jmena[1] <- "tereza"
jmena
jmena[3] <- "tomáš"
jmena
jmena <- c(jmena, "petra")
jmena <- append(jmena, "nikola")

## Listy
### Pořád vracím list
data[1]
data[2]

### Tady vracím hodnoty
data[[1]]
data[[2]]

### Pomocí jména, stejné jako [[x]]
data$jmena
data$je_ctvrtek

### Pomocí textu
data["jmena"]
data[["jmena"]]

### Přepisování
data$data2 <- list(a = 3)
data

data$jmena <- c("d", "e")
data

data$neco_noveho <- FALSE
data

## data.frame
moje_data$respondent
moje_data$odpoved

# Funkce

# nazev()
# read_csv(file="...", sep="")
# read_csv(file = povinný, sep=nepovinný)
moje_funkce <- function(
  # ...
) {
  # ...
}

# ---

# 4
# filmy
# rok_vydani
# je_dobrej

# vektor, list, data.frame

# Funkce

# nazev()
# read_csv(file="...", sep="")
# read_csv(file = povinný, sep=nepovinný)
moje_funkce <- function(
  # ...
) {
  # ...
}

# Jednoduchá funkce
pozdrav <- function(jmeno, jazyk = "cz") {
  if (jazyk == "cz") {
    print(paste("Ahoj uživateli:", jmeno))
  } else if (jazyk == "sk") {
    print(paste("Dobrý deň, uživatel:", jmeno))
  } else {
    print(paste("Tenhle jazyk (", jazyk, ") neznám."))
  }
}

pozdrav(jmeno = "michal")
pozdrav(jmeno = "nikola", jazyk = "sk")
pozdrav(jmeno = "george", jazyk = "en")

# = -> přiřazení hodnoty
# == -> otázka? kontrola hodnot

# --- Načítání souborů
# https://www.kaggle.com/datasets/debayank2024/house-price-prediction
df <- read.csv(
  file = "modified_data.csv"
)

# df$

head(df)
tail(df)
str(df)
nrow(df)
ncol(df)


pozdrav <- function(jmeno, jazyk = "cz") {
  if (jazyk == "cz") {
    paste("Ahoj uživateli:", jmeno)
  } else if (jazyk == "sk") {
    paste("Dobrý deň, uživatel:", jmeno)
  } else {
    # txt <- "prázdná hodnota"
    print(cat("Tenhle jazyk (", jazyk, ") neznám."))
  }
}
pozdrav("michal", jazyk = "saak")

# Tidyverse
library(readxl)
library(dplyr)
# ggplot2
df <- read_excel("data/260820_new.xlsx")
df_clas <-
  df |>
  mutate(
    cd3d_ter1 = quantile(CD3D, prob = 1 / 3), # 0.333..
    cd3d_ter2 = quantile(CD3D, prob = 2 / 3), # 0.666..
    cd3d_clas = ifelse(
      CD3D < cd3d_ter1,
      yes = "Low",
      no = ifelse(
        CD3D < cd3d_ter2,
        yes = "Medium",
        no = "High"
      )
    ),
    cd3d_clas = ordered(
      x = cd3d_clas,
      levels = c("Low", "Medium", "High")
    )
  )

df_clas |>
  group_by(cd3d_clas) |>
  summarise(
    CD3E_avg = mean(CD3E),
    CD28_sd = sd(CD28), # Výběrové
    CD44_var = var(CD44) # Výběrové
  )

# {ggplot2}
library(ggplot2)
ggplot(data = df_clas) +
  geom_point(
    mapping = aes(x = cd3d_clas, y = CD28, color = cd3d_clas),
    alpha = 0.5
  ) +
  geom_boxplot(
    mapping = aes(x = cd3d_clas, y = CD28, color = cd3d_clas),
    outlier.alpha = 0,
    show.legend = FALSE,
    alpha = 0.5
  ) +
  theme_classic() +
  labs(
    x = "Klasifikace CD3D",
    y = "CD28"
  )

ggplot(data = df_clas) +
  geom_point(
    mapping = aes(
      x = CD3D,
      y = CD28,
      shape = cd3d_clas,
      color = cd3d_clas
    )
  ) +
  theme_classic()

# Populační SD = sqrt( ...  / n)
# Výběrová SD = sqrt( ...  / (n - 1))
# 'Faktor' => Výběrová Var * (n - 1) / n = Populační Var
# Směrodatná odchylka = odmocnina(rozptyl)
#  - Výběrová SD = odmocnina(výběrový var)   - odhadování, nemám všechna data
#  - Populační SD = odmocnina(populační var) - mám celou populaci

var(df$CD44) # Výběrový rozptyl; rozptyl.s
# knihovna {DescTools} - VarN, SDN
var(df$CD44) * (nrow(df) - 1) / nrow(df)
# Populační SD
sqrt(var(df$CD44) * (nrow(df) - 1) / nrow(df))

# # Median
# quantile(df$CD3E, prob = 0.5)
# # Quartile
# quantile(df$CD3E, prob = c(1/4, 2/4, 3/4))

# Base R
library(readxl)
df <- read_excel("data/260820_new.xlsx")

df$cd3d_ter1 <- quantile(df$CD3D, prob = 1 / 3)
# np.quantile()
df$cd3d_ter2 <- quantile(df$CD3D, prob = 2 / 3)
df$cd3d_clas <- ifelse(
  df$CD3D < df$cd3d_ter1,
  yes = "Low",
  no = ifelse(
    df$CD3D < df$cd3d_ter2,
    yes = "Medium",
    no = "High"
  )
)

df[, c("CD3D", "cd3d_ter1", "cd3d_ter2", "cd3d_clas")]
# df.select("...")

# Base R
boxplot(
  df_clas$CD28 ~ df_clas$cd3d_clas
)